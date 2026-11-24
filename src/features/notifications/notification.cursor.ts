import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { NotificationFeedCursor, NotificationSort } from './notification.repository';

/**
 * Opaque keyset cursor for the notification feed: base64url(JSON { v, s, t, i }).
 * It only says *where* to continue; it is never used for authorization (every query is scoped to the session user).
 */
const CURSOR_VERSION = 1;
export const MAX_CURSOR_LENGTH = 200;

const cursorSchema = z.strictObject({
  v: z.literal(CURSOR_VERSION),
  s: z.enum(['asc', 'desc']),
  t: z.iso.datetime(),
  i: z.number().int().positive(),
});

const invalidCursor = () => ApiError.badRequest('cursor: Invalid or expired cursor');

export const encodeCursor = (row: { createdAt: Date; id: number | string }, sort: NotificationSort): string =>
  Buffer.from(JSON.stringify({ v: CURSOR_VERSION, s: sort, t: row.createdAt.toISOString(), i: Number(row.id) })).toString(
    'base64url',
  );

export const decodeCursor = (cursor: string, sort: NotificationSort): NotificationFeedCursor => {
  if (cursor.length > MAX_CURSOR_LENGTH || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw invalidCursor();

  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw invalidCursor();
  }

  const parsed = cursorSchema.safeParse(raw);
  if (!parsed.success) throw invalidCursor();
  if (parsed.data.s !== sort) {
    throw ApiError.badRequest('cursor: The cursor was issued for a different sort order. Start again without a cursor.');
  }

  return { createdAt: new Date(parsed.data.t), id: parsed.data.i };
};
