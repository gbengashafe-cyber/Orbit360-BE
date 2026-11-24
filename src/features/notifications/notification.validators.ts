import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { decodeCursor, MAX_CURSOR_LENGTH } from './notification.cursor';
import { NOTIFICATION_CATEGORIES } from './notification.model';
import { NotificationFeedCursor, NotificationFeedFilters } from './notification.repository';

export const DEFAULT_FEED_ROWS = 20;
export const MAX_FEED_ROWS = 50;

// A real calendar date in YYYY-MM-DD (rejects e.g. 2026-02-31).
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in YYYY-MM-DD format')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }, 'Dates must be valid calendar dates');

const category = z.enum(NOTIFICATION_CATEGORIES, { message: `category must be one of ${NOTIFICATION_CATEGORIES.join(', ')}` });

const feedQuerySchema = z
  .object({
    category: category.optional(),
    status: z.enum(['all', 'unread', 'read'], { message: 'status must be one of all, unread, read' }).default('all'),
    dateFrom: isoDate.optional(),
    dateTo: isoDate.optional(),
    sort: z.enum(['asc', 'desc'], { message: 'sort must be asc or desc' }).default('desc'),
    cursor: z.string().min(1).max(MAX_CURSOR_LENGTH).optional(),
    // Larger values are capped (same behaviour as the global page/rows parser).
    rows: z.coerce
      .number({ message: 'rows must be a number' })
      .int('rows must be a whole number')
      .positive('rows must be at least 1')
      .default(DEFAULT_FEED_ROWS)
      .transform((value) => Math.min(value, MAX_FEED_ROWS)),
  })
  .refine((value) => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo, {
    message: 'Start date must be on or before end date',
    path: ['dateFrom'],
  });

const readAllQuerySchema = z.object({ category: category.optional() });

const preferenceUpdateSchema = z
  .strictObject({
    category,
    inAppEnabled: z.boolean().optional(),
    realtimeEnabled: z.boolean().optional(),
  })
  .refine((value) => value.inAppEnabled !== undefined || value.realtimeEnabled !== undefined, {
    message: 'At least one preference value is required',
  });

const realtimePollQuerySchema = z.object({
  rows: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_FEED_ROWS)
    .transform((value) => Math.min(value, MAX_FEED_ROWS)),
});

const realtimeAcknowledgeSchema = z.strictObject({
  ids: z
    .array(z.coerce.number().int().positive())
    .min(1)
    .max(100)
    .transform((ids) => [...new Set(ids)]),
});

const idParamSchema = z.object({
  id: z.coerce.number().int('Notification ID must be a positive number').positive('Notification ID must be a positive number'),
});

export type FeedQuery = { filters: NotificationFeedFilters; cursor: NotificationFeedCursor | null; rows: number };

// Empty strings are treated as "not provided", like the complaint list validators.
const pick = (query: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, query[key] === '' ? undefined : query[key]]));

const validateFeedQuery = (req: Request, res: Response, next: NextFunction) => {
  const query = feedQuerySchema.parse(
    pick(req.query as Record<string, unknown>, ['category', 'status', 'dateFrom', 'dateTo', 'sort', 'cursor', 'rows']),
  );
  const { cursor, rows, ...filters } = query;
  res.locals.feedQuery = {
    filters,
    cursor: cursor ? decodeCursor(cursor, filters.sort) : null,
    rows,
  } satisfies FeedQuery;
  next();
};

const validateReadAllQuery = (req: Request, res: Response, next: NextFunction) => {
  res.locals.readAllQuery = readAllQuerySchema.parse(pick(req.query as Record<string, unknown>, ['category']));
  next();
};

const validatePreferenceUpdate = (req: Request, res: Response, next: NextFunction) => {
  res.locals.preferenceUpdate = preferenceUpdateSchema.parse(req.body);
  next();
};

const validateRealtimePollQuery = (req: Request, res: Response, next: NextFunction) => {
  res.locals.realtimePollQuery = realtimePollQuerySchema.parse(pick(req.query as Record<string, unknown>, ['rows']));
  next();
};

const validateRealtimeAcknowledge = (req: Request, res: Response, next: NextFunction) => {
  res.locals.realtimeAcknowledge = realtimeAcknowledgeSchema.parse(req.body);
  next();
};

const validateNotificationIdParam = (req: Request, res: Response, next: NextFunction) => {
  res.locals.notificationId = idParamSchema.parse(req.params).id;
  next();
};

export {
  validateFeedQuery,
  validateNotificationIdParam,
  validatePreferenceUpdate,
  validateReadAllQuery,
  validateRealtimeAcknowledge,
  validateRealtimePollQuery,
};
