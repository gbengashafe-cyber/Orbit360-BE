/**
 * Shared helpers for the notification tests.
 *
 * These are integration tests against the local development database configured in `.env`
 * (they need the `notifications` table from migration 20261124120000-create-notifications.cjs).
 * They never touch other tables' data: they only read users/employees, and they delete only the
 * notification rows they created themselves (tracked by id).
 */
import { randomBytes, randomInt } from 'node:crypto';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { Op, QueryTypes } from 'sequelize';
import { db } from '../../../db';
import { AuthUtil, TOKEN_FINGERPRINT_COOKIE_NAME } from '../../authentication/auth.utils';
import { TokenUtil } from '../../authentication/token.util';
import { Notification } from '../notification.model';

export type TestUser = { userId: number; employeeId: number; firstName: string; lastName: string; email: string };

const createdIds = new Set<number>();

export const track = (...ids: (number | string | undefined | null)[]) => {
  ids.forEach((id) => {
    if (id != null) createdIds.add(Number(id));
  });
};

/** Deletes only the notification rows this test run created. */
export const cleanupTrackedNotifications = async () => {
  if (!createdIds.size) return;
  await Notification.destroy({ where: { id: { [Op.in]: [...createdIds] } }, logging: false });
  createdIds.clear();
};

/** Users that have a matching employee record (users.email = employees.email), lowest ids first. */
export const findUsersWithEmployees = async (count: number): Promise<TestUser[]> => {
  const rows = await db.query<TestUser>(
    `SELECT u.id AS userId, e.id AS employeeId, e.first_name AS firstName, e.last_name AS lastName, u.email AS email
       FROM users u JOIN employees e ON e.email = u.email
      WHERE u.deleted_at IS NULL
      ORDER BY u.id
      LIMIT :count`,
    { replacements: { count }, type: QueryTypes.SELECT, logging: false },
  );
  if (rows.length < count) {
    throw new Error(`These tests need ${count} users with matching employee records; found ${rows.length}.`);
  }
  return rows;
};

/** Refuse to run against users who already have notifications, so the tests never touch real data. */
export const assertNoExistingNotifications = async (userIds: number[]) => {
  const existing = await Notification.count({ where: { recipientUserId: { [Op.in]: userIds } }, logging: false });
  if (existing > 0) {
    throw new Error(
      `Test users ${userIds.join(', ')} already have ${existing} notification(s). ` +
        'The tests only run against users with no notifications so they never modify real data.',
    );
  }
};

/** A random entity id far above real ids, so dedupe keys never collide with real records. */
export const fakeEntityId = () => 900_000_000 + randomInt(0, 99_999_999);

export const uniqueKey = (label: string) => `test.${label}.${randomBytes(6).toString('hex')}`;

/** A valid access token + fingerprint cookie for a user, built the same way the login flow does. */
export const authHeadersFor = (userId: number) => {
  const fingerprint = randomBytes(32).toString('hex');
  const token = TokenUtil.generateToken({ sub: String(userId), ctx: AuthUtil.hashUserContext(fingerprint) });
  return { Authorization: `Bearer ${token}`, Cookie: `${TOKEN_FINGERPRINT_COOKIE_NAME}=${fingerprint}` };
};

export const startServer = async () => {
  // Imported lazily so unit tests that don't need HTTP don't load every route.
  const { app } = await import('../../../app');
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}/api/v1/notifications`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
};

export const setCreatedAt = async (id: number, createdAt: Date) => {
  // Raw UPDATE: Sequelize does not let model updates change createdAt.
  // The value is passed as an explicit UTC string: raw `replacements` format Date objects in the machine's local
  // timezone, whereas model queries (used by all production notification code) write UTC.
  const utc = createdAt.toISOString().slice(0, 19).replace('T', ' ');
  await db.query('UPDATE notifications SET created_at = :utc WHERE id = :id', {
    replacements: { utc, id },
    logging: false,
  });
};

export const waitFor = async (predicate: () => boolean, timeoutMs = 3000) => {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error('Timed out waiting for condition');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
