import { CreationAttributes, fn, col, Op, WhereOptions } from 'sequelize';
import { addDays, startOfLocalDayUtc } from './notification.dates';
import { Notification, NotificationCategory } from './notification.model';

// Notification queries never log SQL, so message text and recipients stay out of application logs.
const NO_LOGGING = { logging: false as const };

export type NotificationReadStatus = 'all' | 'unread' | 'read';
export type NotificationSort = 'asc' | 'desc';

export type NotificationFeedFilters = {
  category?: NotificationCategory;
  status: NotificationReadStatus;
  dateFrom?: string; // YYYY-MM-DD, inclusive, Africa/Lagos calendar day
  dateTo?: string; // YYYY-MM-DD, inclusive, Africa/Lagos calendar day
  sort: NotificationSort;
};

export type NotificationFeedCursor = { createdAt: Date; id: number };

const buildFilterWhere = (recipientUserId: number, filters: Omit<NotificationFeedFilters, 'sort'>) => {
  const conditions: WhereOptions<Notification>[] = [{ recipientUserId }, { inAppEnabled: true }];

  if (filters.category) conditions.push({ category: filters.category });
  if (filters.status === 'unread') conditions.push({ readAt: { [Op.is]: null } });
  if (filters.status === 'read') conditions.push({ readAt: { [Op.not]: null } });
  if (filters.dateFrom) conditions.push({ createdAt: { [Op.gte]: startOfLocalDayUtc(filters.dateFrom) } });
  if (filters.dateTo) conditions.push({ createdAt: { [Op.lt]: startOfLocalDayUtc(addDays(filters.dateTo, 1)) } });

  return conditions;
};

// Keyset condition equivalent to `(created_at, id) < (?, ?)` (desc) or `> (?, ?)` (asc).
const buildCursorWhere = (cursor: NotificationFeedCursor, sort: NotificationSort): { [Op.or]: WhereOptions<Notification>[] } => {
  const op: typeof Op.lt | typeof Op.gt = sort === 'desc' ? Op.lt : Op.gt;
  const beyondTime: WhereOptions<Notification> = { createdAt: { [op]: cursor.createdAt } };
  const sameTimeBeyondId: WhereOptions<Notification> = { createdAt: cursor.createdAt, id: { [op]: cursor.id } };
  return { [Op.or]: [beyondTime, sameTimeBeyondId] };
};

export class NotificationRepository {
  static readonly create = (values: CreationAttributes<Notification>) => {
    return Notification.create(values, NO_LOGGING);
  };

  /**
   * One page of a recipient's feed, ordered by (created_at, id). Fetches `limit + 1` rows so the caller can tell
   * whether another page exists. Every page carries the same recipient and filter constraints.
   */
  static readonly findFeedPage = (
    recipientUserId: number,
    filters: NotificationFeedFilters,
    cursor: NotificationFeedCursor | null,
    limit: number,
  ) => {
    const conditions = buildFilterWhere(recipientUserId, filters);
    if (cursor) conditions.push(buildCursorWhere(cursor, filters.sort));

    const direction = filters.sort === 'desc' ? 'DESC' : 'ASC';
    return Notification.findAll({
      where: { [Op.and]: conditions },
      order: [
        ['createdAt', direction],
        ['id', direction],
      ],
      limit: limit + 1,
      ...NO_LOGGING,
    });
  };

  /** Pending real-time alerts are returned oldest-first and remain pending until the caller acknowledges them. */
  static readonly findRealtimePending = (recipientUserId: number, limit: number) =>
    Notification.findAll({
      where: { recipientUserId, realtimeEnabled: true, realtimeAcknowledgedAt: { [Op.is]: null } },
      order: [
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: limit + 1,
      ...NO_LOGGING,
    });

  static readonly countUnreadByCategory = async (recipientUserId: number) => {
    const rows = (await Notification.findAll({
      attributes: ['category', [fn('COUNT', col('id')), 'count']],
      where: { recipientUserId, inAppEnabled: true, readAt: { [Op.is]: null } },
      group: ['category'],
      raw: true,
      ...NO_LOGGING,
    })) as unknown as { category: NotificationCategory; count: number | string }[];

    return rows.map((row) => ({ category: row.category, count: Number(row.count) }));
  };

  /** A notification only if it belongs to the recipient. */
  static readonly findOwn = (recipientUserId: number, id: number) => {
    return Notification.findOne({ where: { id, recipientUserId, inAppEnabled: true }, ...NO_LOGGING });
  };

  static readonly setReadAt = async (recipientUserId: number, id: number, readAt: Date | null) => {
    const [affected] = await Notification.update(
      { readAt },
      {
        where: {
          id,
          recipientUserId,
          inAppEnabled: true,
          // Only touch rows whose state actually changes, so read_at keeps the first time it was read.
          readAt: readAt ? { [Op.is]: null } : { [Op.not]: null },
        },
        ...NO_LOGGING,
      },
    );
    return affected;
  };

  static readonly markAllRead = async (recipientUserId: number, category?: NotificationCategory) => {
    const [affected] = await Notification.update(
      { readAt: new Date() },
      {
        where: { recipientUserId, inAppEnabled: true, readAt: { [Op.is]: null }, ...(category ? { category } : {}) },
        ...NO_LOGGING,
      },
    );
    return affected;
  };

  /** Acknowledgements are recipient-scoped, channel-scoped, and idempotent. */
  static readonly acknowledgeRealtime = async (recipientUserId: number, ids: number[]) => {
    const [affected] = await Notification.update(
      { realtimeAcknowledgedAt: new Date() },
      {
        where: {
          recipientUserId,
          id: { [Op.in]: ids },
          realtimeEnabled: true,
          realtimeAcknowledgedAt: { [Op.is]: null },
        },
        ...NO_LOGGING,
      },
    );
    return affected;
  };
}
