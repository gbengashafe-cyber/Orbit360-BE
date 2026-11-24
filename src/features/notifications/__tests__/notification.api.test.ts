import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import { db } from '../../../db';
import { Notification, NotificationCategory } from '../notification.model';
import { NotificationRepository } from '../notification.repository';
import {
  assertNoExistingNotifications,
  authHeadersFor,
  cleanupTrackedNotifications,
  findUsersWithEmployees,
  setCreatedAt,
  startServer,
  TestUser,
  track,
  uniqueKey,
} from './test-helpers';

let alice: TestUser;
let bob: TestUser;
let server: Awaited<ReturnType<typeof startServer>>;

type Json = { success: boolean; message: string; data: any; pagination?: any };

const call = async (method: string, path: string, user?: TestUser, headers: Record<string, string> = {}) => {
  const response = await fetch(`${server.baseUrl}${path}`, {
    method,
    headers: { ...(user ? authHeadersFor(user.userId) : {}), ...headers },
  });
  return { status: response.status, body: (await response.json()) as Json };
};

/** Inserts a notification directly (the internal path is covered by the service tests). */
const insert = async (
  user: TestUser,
  { category = 'GENERAL', createdAt, read = false }: { category?: NotificationCategory; createdAt?: Date; read?: boolean } = {},
) => {
  const row = await NotificationRepository.create({
    recipientUserId: user.userId,
    category,
    eventType: 'TEST_EVENT',
    audience: 'DIRECT',
    title: `${category} test`,
    message: 'Test notification',
    dedupeKey: uniqueKey('api'),
    readAt: read ? new Date() : null,
  });
  track(row.id);
  if (createdAt) await setCreatedAt(Number(row.id), createdAt);
  return Number(row.id);
};

/** Walks every page with the given query and returns the ids in the order received. */
const walk = async (user: TestUser, query: string) => {
  const ids: number[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    const params = [query, cursor ? 'cursor=' + encodeURIComponent(cursor) : ''].filter(Boolean).join('&');
    const { status, body } = await call('GET', '?' + params, user);
    assert.equal(status, 200, body.message);
    ids.push(...body.data.map((n: { id: number }) => n.id));
    cursor = body.pagination.nextCursor;
    assert.equal(body.pagination.hasMore, cursor !== null);
    pages += 1;
    assert.ok(pages < 50, 'pagination terminates');
  } while (cursor);
  return { ids, pages };
};

before(async () => {
  [alice, bob] = await findUsersWithEmployees(2);
  await assertNoExistingNotifications([alice.userId, bob.userId]);
  server = await startServer();
});

afterEach(() => cleanupTrackedNotifications());

after(async () => {
  await server?.close();
  await db.close();
});

describe('authentication', () => {
  const routes: [string, string][] = [
    ['GET', ''],
    ['GET', '/unread-count'],
    ['PATCH', '/read-all'],
    ['PATCH', '/1/read'],
    ['PATCH', '/1/unread'],
  ];

  for (const [method, path] of routes) {
    it(`${method} ${path || '/'} rejects unauthenticated requests`, async () => {
      const { status, body } = await call(method, path);
      assert.equal(status, 401);
      assert.equal(body.success, false);
    });
  }

  it('rejects a token without its fingerprint cookie', async () => {
    const { Authorization } = authHeadersFor(alice.userId);
    const { status } = await call('GET', '', undefined, { Authorization });
    assert.equal(status, 401);
  });

  it('rejects a token whose fingerprint belongs to another session', async () => {
    const { Authorization } = authHeadersFor(alice.userId);
    const { Cookie } = authHeadersFor(alice.userId);
    const { status } = await call('GET', '', undefined, { Authorization, Cookie });
    assert.equal(status, 401);
  });

  it('there is no endpoint to create notifications', async () => {
    const { status } = await call('POST', '', alice);
    assert.equal(status, 404);
  });
});

describe('feed', () => {
  it('returns a valid empty feed', async () => {
    const { status, body } = await call('GET', '', alice);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, []);
    assert.deepEqual(body.pagination, { rows: 20, sort: 'desc', hasMore: false, nextCursor: null });
  });

  it("returns only the caller's notifications", async () => {
    const mine = [await insert(alice), await insert(alice), await insert(alice)];
    await insert(bob);
    await insert(bob);

    const { body } = await call('GET', '', alice);
    const byNumber = (a: number, b: number) => a - b;
    const returned: number[] = body.data.map((n: { id: number }) => n.id);
    assert.deepEqual([...returned].sort(byNumber), [...mine].sort(byNumber));

    const asBob = await call('GET', '', bob);
    assert.equal(asBob.body.data.length, 2);
    assert.ok(asBob.body.data.every((n: { id: number }) => !mine.includes(n.id)));
  });

  it('ignores any recipient-like query parameter', async () => {
    await insert(bob);
    const { status, body } = await call('GET', `?recipientUserId=${bob.userId}&userId=${bob.userId}`, alice);
    assert.equal(status, 200);
    assert.deepEqual(body.data, []);
  });

  it('returns the documented notification shape', async () => {
    await insert(alice, { category: 'LEAVE' });
    const { body } = await call('GET', '', alice);
    assert.deepEqual(
      [...Object.keys(body.data[0])].sort((a, b) => a.localeCompare(b)),
      [
        'audience',
        'category',
        'createdAt',
        'entityId',
        'entityType',
        'eventType',
        'id',
        'isRead',
        'message',
        'metadata',
        'readAt',
        'title',
      ],
    );
  });

  it('filters by category', async () => {
    const leave = await insert(alice, { category: 'LEAVE' });
    await insert(alice, { category: 'LOAN' });
    const complaint = await insert(alice, { category: 'COMPLAINT' });

    assert.deepEqual(
      (await call('GET', '?category=LEAVE', alice)).body.data.map((n: { id: number }) => n.id),
      [leave],
    );
    assert.deepEqual(
      (await call('GET', '?category=COMPLAINT', alice)).body.data.map((n: { id: number }) => n.id),
      [complaint],
    );
  });

  it('filters by read status', async () => {
    const unread = await insert(alice);
    const read = await insert(alice, { read: true });

    const unreadIds = (await call('GET', '?status=unread', alice)).body.data.map((n: { id: number }) => n.id);
    const readIds = (await call('GET', '?status=read', alice)).body.data.map((n: { id: number }) => n.id);
    const all = (await call('GET', '?status=all', alice)).body.data;

    assert.deepEqual(unreadIds, [unread]);
    assert.deepEqual(readIds, [read]);
    assert.equal(all.length, 2);
    assert.equal(all.find((n: { id: number }) => n.id === read).isRead, true);
  });

  it('filters by Africa/Lagos calendar dates (inclusive)', async () => {
    const lateDec1Utc = await insert(alice, { createdAt: new Date('2026-12-01T23:30:00Z') }); // 2 Dec 00:30 in Lagos
    const dec1 = await insert(alice, { createdAt: new Date('2026-12-01T12:00:00Z') });
    const dec3 = await insert(alice, { createdAt: new Date('2026-12-03T22:59:59Z') }); // 3 Dec 23:59:59 in Lagos

    const ids = async (query: string) =>
      (await call('GET', query, alice)).body.data.map((n: { id: number }) => n.id).sort((a: number, b: number) => a - b);

    assert.deepEqual(await ids('?dateFrom=2026-12-02&dateTo=2026-12-02'), [lateDec1Utc]);
    assert.deepEqual(await ids('?dateTo=2026-12-01'), [dec1]);
    assert.deepEqual(await ids('?dateFrom=2026-12-03'), [dec3]);
    assert.deepEqual(
      await ids('?dateFrom=2026-12-01&dateTo=2026-12-03'),
      [lateDec1Utc, dec1, dec3].sort((a, b) => a - b),
    );
  });

  const badQueries = [
    '?category=PAYROLL',
    '?status=archived',
    '?sort=sideways',
    '?rows=0',
    '?rows=abc',
    '?dateFrom=2026-13-01',
    '?dateFrom=2026-02-31',
    '?dateFrom=2026-12-05&dateTo=2026-12-01',
    '?cursor=%%%',
    `?cursor=${'A'.repeat(300)}`,
  ];
  for (const query of badQueries) {
    it(`rejects invalid query ${query.slice(0, 40)}`, async () => {
      const { status, body } = await call('GET', query, alice);
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });
  }

  it('caps rows at 50', async () => {
    const { status, body } = await call('GET', '?rows=500', alice);
    assert.equal(status, 200);
    assert.equal(body.pagination.rows, 50);
  });
});

describe('unread count', () => {
  it('is zero with every category present when there are no notifications', async () => {
    const { status, body } = await call('GET', '/unread-count', alice);
    assert.equal(status, 200);
    assert.deepEqual(body.data, {
      total: 0,
      byCategory: { LEAVE: 0, LOAN: 0, TRAINING: 0, RELIEVER: 0, COMPLAINT: 0, GENERAL: 0 },
    });
  });

  it('counts only unread notifications of the caller, by category', async () => {
    await insert(alice, { category: 'LEAVE' });
    await insert(alice, { category: 'LEAVE' });
    await insert(alice, { category: 'TRAINING' });
    await insert(alice, { category: 'LOAN', read: true });
    await insert(bob, { category: 'LEAVE' });

    const { body } = await call('GET', '/unread-count', alice);
    assert.equal(body.data.total, 3);
    assert.equal(body.data.byCategory.LEAVE, 2);
    assert.equal(body.data.byCategory.TRAINING, 1);
    assert.equal(body.data.byCategory.LOAN, 0);
  });

  it('updates as notifications are read and unread', async () => {
    const id = await insert(alice);
    assert.equal((await call('GET', '/unread-count', alice)).body.data.total, 1);
    await call('PATCH', `/${id}/read`, alice);
    assert.equal((await call('GET', '/unread-count', alice)).body.data.total, 0);
    await call('PATCH', `/${id}/unread`, alice);
    assert.equal((await call('GET', '/unread-count', alice)).body.data.total, 1);
  });
});

describe('read state', () => {
  it('marks one of my notifications read and keeps the first read time', async () => {
    const id = await insert(alice);
    const first = await call('PATCH', `/${id}/read`, alice);
    assert.equal(first.status, 200);
    assert.equal(first.body.data.id, id);
    assert.equal(first.body.data.isRead, true);
    assert.ok(first.body.data.readAt);

    const again = await call('PATCH', `/${id}/read`, alice);
    assert.equal(again.status, 200);
    assert.equal(again.body.data.readAt, first.body.data.readAt, 'idempotent');
  });

  it('marks one of my notifications unread', async () => {
    const id = await insert(alice, { read: true });
    const { status, body } = await call('PATCH', `/${id}/unread`, alice);
    assert.equal(status, 200);
    assert.equal(body.data.isRead, false);
    assert.equal(body.data.readAt, null);
  });

  it("cannot mark another user's notification read (404, unchanged)", async () => {
    const bobs = await insert(bob);
    const { status, body } = await call('PATCH', `/${bobs}/read`, alice);
    assert.equal(status, 404);
    assert.equal(body.message, 'Notification not found');
    assert.equal((await Notification.findByPk(bobs, { logging: false }))?.readAt, null);
  });

  it("cannot mark another user's notification unread (404, unchanged)", async () => {
    const bobs = await insert(bob, { read: true });
    const { status } = await call('PATCH', `/${bobs}/unread`, alice);
    assert.equal(status, 404);
    assert.notEqual((await Notification.findByPk(bobs, { logging: false }))?.readAt, null);
  });

  it('returns the same 404 for a notification that does not exist', async () => {
    const { status, body } = await call('PATCH', '/999999999999/read', alice);
    assert.equal(status, 404);
    assert.equal(body.message, 'Notification not found');
  });

  it('rejects an invalid id', async () => {
    assert.equal((await call('PATCH', '/abc/read', alice)).status, 400);
    assert.equal((await call('PATCH', '/0/unread', alice)).status, 400);
  });

  it('read-all only affects my notifications', async () => {
    await insert(alice);
    await insert(alice, { category: 'LEAVE' });
    const bobs = await insert(bob);

    const { status, body } = await call('PATCH', '/read-all', alice);
    assert.equal(status, 200);
    assert.deepEqual(body.data, { updated: 2 });
    assert.equal((await call('GET', '/unread-count', alice)).body.data.total, 0);
    assert.equal((await Notification.findByPk(bobs, { logging: false }))?.readAt, null);
  });

  it('read-all can be limited to one category', async () => {
    await insert(alice, { category: 'LEAVE' });
    await insert(alice, { category: 'LOAN' });

    const { body } = await call('PATCH', '/read-all?category=LEAVE', alice);
    assert.deepEqual(body.data, { updated: 1 });
    const counts = (await call('GET', '/unread-count', alice)).body.data;
    assert.equal(counts.byCategory.LEAVE, 0);
    assert.equal(counts.byCategory.LOAN, 1);
  });

  it('read-all rejects an invalid category', async () => {
    assert.equal((await call('PATCH', '/read-all?category=NOPE', alice)).status, 400);
  });
});

describe('cursor pagination', () => {
  // In the past, so rows inserted "now" during a test are newer than every seeded row.
  const SAME_SECOND = new Date('2026-01-15T09:00:00Z');

  /** 23 rows: 10 share one timestamp; the rest are spread out. Returns ids in expected desc order. */
  const seed = async (user: TestUser) => {
    const rows: { id: number; createdAt: Date }[] = [];
    for (let i = 0; i < 10; i += 1) rows.push({ id: await insert(user, { createdAt: SAME_SECOND }), createdAt: SAME_SECOND });
    for (let i = 0; i < 13; i += 1) {
      const createdAt = new Date(SAME_SECOND.getTime() + (i - 6) * 60_000);
      rows.push({ id: await insert(user, { createdAt, category: i % 2 ? 'LEAVE' : 'GENERAL' }), createdAt });
    }
    const ordered = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
    return ordered.map((row) => row.id);
  };

  it('first page returns rows, hasMore and a nextCursor', async () => {
    await seed(alice);
    const { body } = await call('GET', '?rows=5', alice);
    assert.equal(body.data.length, 5);
    assert.equal(body.pagination.hasMore, true);
    assert.equal(typeof body.pagination.nextCursor, 'string');
  });

  it('walks every page descending with identical timestamps: no duplicates, nothing missing, exact order', async () => {
    const expected = await seed(alice);
    const { ids, pages } = await walk(alice, 'rows=4');
    assert.deepEqual(ids, expected);
    assert.equal(pages, Math.ceil(expected.length / 4));
  });

  it('walks every page ascending', async () => {
    const descending = await seed(alice);
    const expected = [...descending].reverse();
    const { ids } = await walk(alice, 'rows=6&sort=asc');
    assert.deepEqual(ids, expected);
  });

  it('page boundaries can fall inside a group of identical timestamps', async () => {
    const expected = await seed(alice);
    // rows=3 forces several boundaries inside the 10 same-second rows.
    const { ids } = await walk(alice, 'rows=3');
    assert.deepEqual(ids, expected);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('keeps filters on every page when combined with a cursor', async () => {
    await seed(alice);
    const leaveIds = (await Notification.findAll({ where: { recipientUserId: alice.userId, category: 'LEAVE' }, logging: false }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || Number(b.id) - Number(a.id))
      .map((row) => Number(row.id));

    const { ids } = await walk(alice, 'rows=2&category=LEAVE&status=unread');
    assert.deepEqual(ids, leaveIds);
  });

  it('new notifications arriving mid-scroll do not shift or duplicate later pages', async () => {
    const expected = await seed(alice);
    const first = await call('GET', '?rows=5', alice);
    const seen: number[] = first.body.data.map((n: { id: number }) => n.id);

    await insert(alice); // arrives "now", i.e. newer than everything already loaded
    await insert(alice);

    let cursor = first.body.pagination.nextCursor;
    while (cursor) {
      const { body } = await call('GET', `?rows=5&cursor=${encodeURIComponent(cursor)}`, alice);
      seen.push(...body.data.map((n: { id: number }) => n.id));
      cursor = body.pagination.nextCursor;
    }
    assert.deepEqual(seen, expected);
  });

  it("a cursor cannot be used to read another user's notifications", async () => {
    await seed(bob);
    const bobsFirst = await call('GET', '?rows=3', bob);
    const { status, body } = await call(
      'GET',
      `?rows=3&cursor=${encodeURIComponent(bobsFirst.body.pagination.nextCursor)}`,
      alice,
    );
    assert.equal(status, 200);
    assert.deepEqual(body.data, []);
  });

  it('rejects a cursor used with a different sort order', async () => {
    await seed(alice);
    const first = await call('GET', '?rows=3', alice);
    const { status } = await call(
      'GET',
      `?rows=3&sort=asc&cursor=${encodeURIComponent(first.body.pagination.nextCursor)}`,
      alice,
    );
    assert.equal(status, 400);
  });

  it('rejects a tampered cursor', async () => {
    const tampered = Buffer.from(JSON.stringify({ v: 1, s: 'desc', t: 'not-a-date', i: 1 })).toString('base64url');
    const { status } = await call('GET', `?cursor=${tampered}`, alice);
    assert.equal(status, 400);
  });
});
