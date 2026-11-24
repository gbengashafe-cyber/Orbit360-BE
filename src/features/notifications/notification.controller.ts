import { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { encodeCursor } from './notification.cursor';
import { Notification, NOTIFICATION_CATEGORIES, NotificationCategory } from './notification.model';
import { NotificationRepository } from './notification.repository';
import { FeedQuery } from './notification.validators';

// Same message whether the notification does not exist or belongs to someone else, so ids can't be probed.
const notFound = () => ApiError.notFound('Notification not found');

// The recipient is always the authenticated account. No endpoint accepts a recipient id.
const sessionUserId = (req: Request) => {
  const id = req.user?.id;
  if (!id) throw ApiError.unauthenticated('Authentication failed');
  return Number(id);
};

const parseMetadata = (metadata: unknown) => {
  if (typeof metadata !== 'string') return metadata ?? null;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
};

// Internal columns (recipient, actor, dedupe key) are not returned.
export const toNotificationView = (notification: Notification) => ({
  id: Number(notification.id),
  category: notification.category,
  eventType: notification.eventType,
  audience: notification.audience,
  title: notification.title,
  message: notification.message,
  entityType: notification.entityType ?? null,
  entityId: notification.entityId ?? null,
  metadata: parseMetadata(notification.metadata),
  isRead: notification.readAt != null,
  readAt: notification.readAt ?? null,
  createdAt: notification.createdAt,
});

export class NotificationController {
  static readonly getFeed = async (req: Request, res: Response) => {
    const { filters, cursor, rows } = res.locals.feedQuery as FeedQuery;
    const results = await NotificationRepository.findFeedPage(sessionUserId(req), filters, cursor, rows);

    const hasMore = results.length > rows;
    const page = hasMore ? results.slice(0, rows) : results;
    const last = page[page.length - 1];

    res.json(
      ApiResponse({
        data: page.map(toNotificationView),
        pagination: {
          rows,
          sort: filters.sort,
          hasMore,
          nextCursor: hasMore && last ? encodeCursor(last, filters.sort) : null,
        },
        message: 'Notifications fetched successfully',
      }),
    );
  };

  static readonly getUnreadCount = async (req: Request, res: Response) => {
    const counts = await NotificationRepository.countUnreadByCategory(sessionUserId(req));

    const byCategory = Object.fromEntries(NOTIFICATION_CATEGORIES.map((category) => [category, 0])) as Record<
      NotificationCategory,
      number
    >;
    counts.forEach(({ category, count }) => {
      byCategory[category] = count;
    });
    const total = Object.values(byCategory).reduce((sum, count) => sum + count, 0);

    res.json(ApiResponse({ data: { total, byCategory }, message: 'Unread notification count fetched successfully' }));
  };

  private static readonly setReadState = async (req: Request, res: Response, read: boolean) => {
    const recipientUserId = sessionUserId(req);
    const id = res.locals.notificationId as number;

    // Scoped update first; a 0-row result is either "already in that state" or "not yours / not found".
    await NotificationRepository.setReadAt(recipientUserId, id, read ? new Date() : null);
    const notification = await NotificationRepository.findOwn(recipientUserId, id);
    if (!notification) throw notFound();

    res.json(
      ApiResponse({
        data: toNotificationView(notification),
        message: read ? 'Notification marked as read' : 'Notification marked as unread',
      }),
    );
  };

  static readonly markRead = (req: Request, res: Response) => NotificationController.setReadState(req, res, true);

  static readonly markUnread = (req: Request, res: Response) => NotificationController.setReadState(req, res, false);

  static readonly markAllRead = async (req: Request, res: Response) => {
    const { category } = res.locals.readAllQuery as { category?: NotificationCategory };
    const updated = await NotificationRepository.markAllRead(sessionUserId(req), category);
    res.json(ApiResponse({ data: { updated }, message: 'Notifications marked as read' }));
  };
}
