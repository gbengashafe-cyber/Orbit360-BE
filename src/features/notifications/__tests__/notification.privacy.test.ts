import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it, mock } from 'node:test';
import { z } from 'zod';
import { db } from '../../../db';
import { toNotificationView } from '../notification.controller';
import * as events from '../notification.events';
import { COMPLAINT_METADATA_KEYS, getNotificationEvent } from '../notification.events';
import { Notification } from '../notification.model';
import { NotificationService, NotifyOutcome } from '../notification.service';
import {
  assertNoExistingNotifications,
  cleanupTrackedNotifications,
  fakeEntityId,
  findUsersWithEmployees,
  TestUser,
  track,
} from './test-helpers';

const SUBMITTED_AT = '2026-12-02T10:00:00.000Z';
const COMPLAINT_EVENTS = ['COMPLAINT_SUBMITTED', 'COMPLAINT_APPROVED', 'COMPLAINT_REJECTED'] as const;

let owner: TestUser;
let other: TestUser;

const trackOutcome = (outcome: NotifyOutcome) => track(...outcome.deliveries.map((delivery) => delivery.notificationId));
const complaintPayload = () => ({
  complaintId: fakeEntityId(),
  ownerEmployeeId: owner.employeeId,
  reference: 'CMP-2026-000123',
  submittedAt: SUBMITTED_AT,
});

const assertNoIdentity = (row: Notification) => {
  const text = `${row.title} ${row.message} ${JSON.stringify(row.metadata ?? {})}`.toLowerCase();
  for (const identifying of [owner.firstName, owner.lastName, owner.email]) {
    if (identifying) assert.ok(!text.includes(identifying.toLowerCase()), 'no complainant identity in the notification');
  }
  assert.equal(row.actorUserId, null, 'no actor on complaint notifications');
  for (const key of Object.keys(row.metadata ?? {})) {
    assert.ok((COMPLAINT_METADATA_KEYS as readonly string[]).includes(key), `metadata key "${key}" is allow-listed`);
  }
};

before(async () => {
  [owner, other] = await findUsersWithEmployees(2);
  await assertNoExistingNotifications([owner.userId, other.userId]);
});

afterEach(async () => {
  mock.restoreAll();
  await cleanupTrackedNotifications();
});

after(() => db.close());

describe('complaint notification privacy', () => {
  for (const eventType of COMPLAINT_EVENTS) {
    it(`${eventType} goes only to the owner and carries no identity, actor or extra metadata`, async () => {
      const outcome = await NotificationService.notify(eventType, complaintPayload());
      trackOutcome(outcome);
      assert.equal(outcome.status, 'delivered');
      assert.deepEqual(
        outcome.deliveries.map((d) => d.recipientUserId),
        [owner.userId],
      );

      const rows = await Notification.findAll({ where: { recipientUserId: [owner.userId, other.userId] }, logging: false });
      assert.equal(rows.length, 1);
      assert.equal(rows[0].recipientUserId, owner.userId);
      assert.equal(rows[0].category, 'COMPLAINT');
      assert.equal(rows[0].audience, 'REQUESTER');
      assertNoIdentity(rows[0]);
    });
  }

  it('complaint events can only ever address the owner', () => {
    for (const eventType of COMPLAINT_EVENTS) {
      const definition = getNotificationEvent(eventType);
      assert.ok(definition);
      assert.equal(definition.maxRecipients, 1);
      assert.deepEqual(definition.recipients(definition.schema.parse(complaintPayload())), [
        { kind: 'employee', employeeId: owner.employeeId },
      ]);
    }
  });

  const identifyingExtras: Record<string, unknown>[] = [
    { complainantName: 'Ada Obi' },
    { employeeName: 'Ada Obi' },
    { ownerEmail: 'ada@example.com' },
    { actorUserId: 4 },
    { isAnonymous: true },
    { description: 'what happened' },
    { reviewerNote: 'note' },
    { recipientUserIds: [5] },
  ];
  for (const extra of identifyingExtras) {
    it(`rejects a complaint payload that includes ${Object.keys(extra)[0]}`, async () => {
      const outcome = await NotificationService.notify('COMPLAINT_SUBMITTED', { ...complaintPayload(), ...extra } as any);
      assert.equal(outcome.status, 'failed');
      assert.equal(outcome.reason, 'invalid_payload');
      assert.equal(await Notification.count({ where: { recipientUserId: [owner.userId, other.userId] }, logging: false }), 0);
    });
  }

  it('the service strips actor and non-allow-listed metadata from complaint rows even if a definition leaks them', async () => {
    // Simulates a future buggy COMPLAINT definition.
    const leaky: events.NotificationEventDefinition<{ id: number }> = {
      category: 'COMPLAINT',
      audience: 'REQUESTER',
      schema: z.object({ id: z.number() }),
      maxRecipients: 1,
      recipients: () => [{ kind: 'user', userId: owner.userId }],
      title: () => 'Complaint update',
      message: () => 'Your complaint was updated.',
      entity: (p) => ({ type: 'complaint', id: String(p.id) }),
      actorUserId: () => other.userId,
      metadata: () => ({ reference: 'CMP-2026-000123', complainantName: 'Ada Obi', ownerEmployeeId: 9 }),
      dedupeKey: (p) => `TEST_LEAKY:complaint:${p.id}`,
    };
    mock.method(events, 'getNotificationEvent', () => leaky);

    const outcome = await NotificationService.notify('COMPLAINT_SUBMITTED', { id: fakeEntityId() } as any);
    trackOutcome(outcome);
    assert.equal(outcome.status, 'delivered');

    const [row] = await Notification.findAll({ where: { recipientUserId: owner.userId }, logging: false });
    assert.equal(row.actorUserId, null);
    assert.deepEqual(row.metadata, { reference: 'CMP-2026-000123' });
  });

  it('the API view never exposes recipient, actor or dedupe key', async () => {
    const outcome = await NotificationService.notify('COMPLAINT_SUBMITTED', complaintPayload());
    trackOutcome(outcome);
    const [row] = await Notification.findAll({ where: { recipientUserId: owner.userId }, logging: false });
    const view = toNotificationView(row) as Record<string, unknown>;
    for (const key of ['recipientUserId', 'actorUserId', 'dedupeKey', 'recipient', 'actor']) {
      assert.ok(!(key in view), `${key} is not returned`);
    }
  });
});
