import { Transaction, UniqueConstraintError } from 'sequelize';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import {
  COMPLAINT_METADATA_KEYS,
  getNotificationEvent,
  NotificationEventPayload,
  NotificationEventType,
  NotificationMetadata,
} from './notification.events';
import { Notification, NOTIFICATION_AUDIENCES, NOTIFICATION_CATEGORIES } from './notification.model';
import { NotificationRecipients } from './notification.recipients';
import { NotificationRepository } from './notification.repository';

export type DeliveryStatus = 'created' | 'duplicate' | 'failed';
export type NotifyStatus = 'delivered' | 'duplicate' | 'partial' | 'skipped' | 'failed';

export type NotifyOutcome = {
  eventType: string;
  /**
   * delivered: every recipient now has the notification (some may have had it already).
   * duplicate: every recipient already had it (idempotent replay).
   * partial:   at least one recipient got it and at least one failed.
   * skipped:   nobody to notify (recipients could not be resolved). Logged as a warning.
   * failed:    nothing was delivered because of an error. Logged as an error.
   */
  status: NotifyStatus;
  reason?: string;
  deliveries: { recipientUserId: number; status: DeliveryStatus; notificationId?: number }[];
};

const MAX_METADATA_BYTES = 4096;

// Final shape check on every row before it is written, independent of the event definition.
const recordSchema = z.object({
  recipientUserId: z.number().int().positive(),
  category: z.enum(NOTIFICATION_CATEGORIES),
  eventType: z.string().min(1).max(64),
  audience: z.enum(NOTIFICATION_AUDIENCES),
  title: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(2000),
  entityType: z.string().min(1).max(40).nullable(),
  entityId: z.string().min(1).max(40).nullable(),
  actorUserId: z.number().int().positive().nullable(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable(),
  dedupeKey: z.string().min(1).max(191),
});

type NotificationRecord = z.infer<typeof recordSchema>;

const failed = (eventType: string, reason: string): NotifyOutcome => ({ eventType, status: 'failed', reason, deliveries: [] });

const summarise = (eventType: string, deliveries: NotifyOutcome['deliveries']): NotifyOutcome => {
  const created = deliveries.filter((d) => d.status === 'created').length;
  const duplicates = deliveries.filter((d) => d.status === 'duplicate').length;
  const failures = deliveries.length - created - duplicates;

  let status: NotifyStatus = 'delivered';
  if (failures === deliveries.length) status = 'failed';
  else if (failures > 0) status = 'partial';
  else if (duplicates === deliveries.length) status = 'duplicate';

  return { eventType, status, deliveries };
};

/**
 * Complaint confidentiality guard (defence in depth on top of the strict complaint payload schema):
 * complaint notifications never carry an actor, and their metadata is limited to an allow-list.
 */
const applyComplaintPrivacy = (record: NotificationRecord): NotificationRecord => {
  if (record.category !== 'COMPLAINT') return record;

  const metadata = record.metadata
    ? (Object.fromEntries(
        Object.entries(record.metadata).filter(([key]) => (COMPLAINT_METADATA_KEYS as readonly string[]).includes(key)),
      ) as NotificationMetadata)
    : null;

  return { ...record, actorUserId: null, metadata };
};

export class NotificationService {
  /**
   * Creates the notification(s) for an event. Internal only: there is no public endpoint for this.
   *
   * Never throws and never rejects. Every failure is logged (event type, ids and error name only: no message text)
   * and reported in the returned outcome, so a failed notification is never mistaken for a delivered one.
   *
   * Call it only after the originating business action has succeeded. If the action runs in a transaction,
   * use `notifyAfterCommit` instead.
   */
  static async notify<T extends NotificationEventType>(
    eventType: T,
    payload: NotificationEventPayload<T>,
  ): Promise<NotifyOutcome> {
    try {
      const definition = getNotificationEvent(eventType);
      if (!definition) {
        logger.error(`[notifications] Unknown event type: ${String(eventType)}`);
        return failed(String(eventType), 'unknown_event');
      }

      const parsed = definition.schema.safeParse(payload);
      if (!parsed.success) {
        // Paths and codes only: payload values may be personal data.
        const issues = parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}:${issue.code}`).join(', ');
        logger.error(`[notifications] Invalid payload for ${eventType}: ${issues}`);
        return failed(eventType, 'invalid_payload');
      }
      const data = parsed.data;

      const { userIds } = await NotificationRecipients.resolve(definition.recipients(data), `notifications:${eventType}`);
      if (userIds.length === 0) {
        logger.warn(`[notifications] ${eventType}: no resolvable recipients; nothing delivered`);
        return { eventType, status: 'skipped', reason: 'no_recipients', deliveries: [] };
      }
      if (userIds.length > definition.maxRecipients) {
        logger.error(
          `[notifications] ${eventType}: ${userIds.length} recipients exceeds the limit of ${definition.maxRecipients}; nothing delivered`,
        );
        return failed(eventType, 'too_many_recipients');
      }

      const entity = definition.entity(data);
      const metadata = definition.metadata(data);
      if (metadata && Buffer.byteLength(JSON.stringify(metadata)) > MAX_METADATA_BYTES) {
        logger.error(`[notifications] ${eventType}: metadata exceeds ${MAX_METADATA_BYTES} bytes; nothing delivered`);
        return failed(eventType, 'metadata_too_large');
      }

      const base = {
        category: definition.category,
        eventType,
        audience: definition.audience,
        title: definition.title(data),
        message: definition.message(data),
        entityType: entity?.type ?? null,
        entityId: entity?.id ?? null,
        actorUserId: definition.actorUserId(data),
        metadata,
        dedupeKey: definition.dedupeKey(data),
      };

      const deliveries: NotifyOutcome['deliveries'] = [];
      for (const recipientUserId of userIds) {
        deliveries.push(await this.createOne(applyComplaintPrivacy({ ...base, recipientUserId })));
      }

      const outcome = summarise(eventType, deliveries);
      if (outcome.status === 'partial') {
        logger.error(`[notifications] ${eventType}: delivered to some recipients only`);
      }
      return outcome;
    } catch (error) {
      logger.error(`[notifications] ${String(eventType)}: unexpected failure (${(error as Error)?.name ?? 'Error'})`);
      return failed(String(eventType), 'unexpected_error');
    }
  }

  /**
   * Schedules `notify` to run only after `transaction` commits.
   *
   * - Nothing happens if the transaction rolls back.
   * - The commit hook returns immediately and can never throw, so a notification problem can never make a
   *   successfully committed business action look failed (Sequelize awaits afterCommit hooks inside commit()).
   * - Delivery runs in the background; `onSettled` (optional) receives the outcome, e.g. for tests or metrics.
   */
  static notifyAfterCommit<T extends NotificationEventType>(
    transaction: Transaction,
    eventType: T,
    payload: NotificationEventPayload<T>,
    onSettled?: (outcome: NotifyOutcome) => void,
  ): void {
    const run = () => {
      this.notify(eventType, payload)
        .then((outcome) => onSettled?.(outcome))
        .catch((error) => logger.error(`[notifications] ${eventType}: after-commit handler failed (${error?.name ?? 'Error'})`));
    };

    // Sequelize sets `finished` once the transaction ends; hooks registered after that would never run.
    const finished = (transaction as Transaction & { finished?: 'commit' | 'rollback' }).finished;
    if (finished === 'commit') {
      run();
      return;
    }
    if (finished === 'rollback') {
      logger.warn(`[notifications] ${eventType}: transaction was rolled back; notification not sent`);
      return;
    }

    transaction.afterCommit(() => {
      run();
    });
  }

  private static async createOne(record: NotificationRecord): Promise<NotifyOutcome['deliveries'][number]> {
    const checked = recordSchema.safeParse(record);
    if (!checked.success) {
      const fields = checked.error.issues.map((issue) => issue.path.join('.')).join(', ');
      logger.error(`[notifications] ${record.eventType}: invalid notification for user ${record.recipientUserId} (${fields})`);
      return { recipientUserId: record.recipientUserId, status: 'failed' };
    }

    try {
      const created: Notification = await NotificationRepository.create(checked.data);
      return { recipientUserId: record.recipientUserId, status: 'created', notificationId: Number(created.id) };
    } catch (error) {
      // The UNIQUE (recipient_user_id, dedupe_key) index makes repeated or concurrent deliveries a no-op.
      if (error instanceof UniqueConstraintError) {
        return { recipientUserId: record.recipientUserId, status: 'duplicate' };
      }
      logger.error(
        `[notifications] ${record.eventType}: could not store notification for user ${record.recipientUserId} (${(error as Error)?.name ?? 'Error'})`,
      );
      return { recipientUserId: record.recipientUserId, status: 'failed' };
    }
  }
}
