import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, afterEach, before, describe, it, mock } from 'node:test';
import { Employee } from '../../employee/employee.model';
import { db } from '../../../db';
import { Notification } from '../notification.model';
import { NotificationRecipients } from '../notification.recipients';
import { NotificationRepository } from '../notification.repository';
import { NotificationService, NotifyOutcome } from '../notification.service';
import {
  assertNoExistingNotifications,
  cleanupTrackedNotifications,
  fakeEntityId,
  findUsersWithEmployees,
  sleep,
  TestUser,
  track,
  uniqueKey,
  waitFor,
} from './test-helpers';

const NON_EXISTENT_USER_ID = 2_147_483_000;
const NON_EXISTENT_EMPLOYEE_ID = 2_147_483_000;
const SUBMITTED_AT = '2026-12-02T10:00:00.000Z';

let alice: TestUser;
let bob: TestUser;

const trackOutcome = (outcome: NotifyOutcome) => track(...outcome.deliveries.map((delivery) => delivery.notificationId));
const rowsFor = (userId: number) => Notification.findAll({ where: { recipientUserId: userId }, logging: false });

before(async () => {
  [alice, bob] = await findUsersWithEmployees(2);
  await assertNoExistingNotifications([alice.userId, bob.userId]);
});

afterEach(async () => {
  mock.restoreAll();
  await cleanupTrackedNotifications();
});

after(() => db.close());

describe('NotificationService.notify: creation', () => {
  it('creates a notification for the employee resolved by email, with the snapshot fields', async () => {
    const leaveId = fakeEntityId();
    const outcome = await NotificationService.notify('LEAVE_APPROVED', {
      leaveId,
      requesterEmployeeId: alice.employeeId,
      submittedAt: SUBMITTED_AT,
    });
    trackOutcome(outcome);

    assert.equal(outcome.status, 'delivered');
    assert.equal(outcome.deliveries.length, 1);
    assert.equal(outcome.deliveries[0].recipientUserId, alice.userId);

    const [row] = await rowsFor(alice.userId);
    assert.equal(row.category, 'LEAVE');
    assert.equal(row.eventType, 'LEAVE_APPROVED');
    assert.equal(row.audience, 'REQUESTER');
    assert.equal(row.title, 'Leave approved');
    assert.equal(row.message, 'Your leave request submitted on 02/12/2026 has been approved.');
    assert.equal(row.entityType, 'leave');
    assert.equal(row.entityId, String(leaveId));
    assert.equal(row.dedupeKey, `LEAVE_APPROVED:leave:${leaveId}`);
    assert.equal(row.readAt, null);
    assert.deepEqual(row.metadata, { status: 'APPROVED', submittedAt: SUBMITTED_AT });
    assert.ok(row.createdAt instanceof Date);
  });

  it('delivers to several explicit recipients when the event allows it (GENERAL)', async () => {
    const outcome = await NotificationService.notify('GENERAL_NOTIFICATION', {
      recipientUserIds: [alice.userId, bob.userId, alice.userId],
      title: 'System maintenance',
      message: 'Orbit360 will be unavailable on Saturday from 22:00.',
      dedupeKey: uniqueKey('general'),
    });
    trackOutcome(outcome);

    assert.equal(outcome.status, 'delivered');
    assert.deepEqual(
      outcome.deliveries.map((d) => d.recipientUserId),
      [alice.userId, bob.userId],
      'duplicate recipients are collapsed',
    );
    assert.equal((await rowsFor(alice.userId)).length, 1);
    assert.equal((await rowsFor(bob.userId)).length, 1);
  });

  it('persists safe metadata exactly', async () => {
    const metadata = { batch: 'Q4', count: 3, urgent: true, note: null };
    const outcome = await NotificationService.notify('GENERAL_NOTIFICATION', {
      recipientUserIds: [alice.userId],
      title: 'Update',
      message: 'Something happened.',
      dedupeKey: uniqueKey('meta'),
      metadata,
    });
    trackOutcome(outcome);

    const [row] = await rowsFor(alice.userId);
    assert.deepEqual(row.metadata, metadata);
  });
});

describe('NotificationService.notify: validation (nothing stored)', () => {
  const cases: [string, string, Record<string, unknown>][] = [
    ['unknown event type', 'NOT_A_REAL_EVENT', {}],
    ['missing required field', 'LEAVE_APPROVED', { leaveId: 1, requesterEmployeeId: 1 }],
    ['invalid date', 'LEAVE_APPROVED', { leaveId: 1, requesterEmployeeId: 1, submittedAt: 'soon' }],
    ['unknown payload field', 'LOAN_APPROVED', { loanId: 1, requesterEmployeeId: 1, submittedAt: SUBMITTED_AT, extra: 'x' }],
    ['empty title', 'GENERAL_NOTIFICATION', { recipientUserIds: [1], title: ' ', message: 'm', dedupeKey: 'k' }],
    ['missing idempotency key', 'GENERAL_NOTIFICATION', { recipientUserIds: [1], title: 't', message: 'm' }],
    [
      'nested (unsafe) metadata',
      'GENERAL_NOTIFICATION',
      { recipientUserIds: [1], title: 't', message: 'm', dedupeKey: 'k', metadata: { nested: { a: 1 } } },
    ],
  ];

  for (const [label, eventType, payload] of cases) {
    it(`fails on ${label}`, async () => {
      const outcome = await NotificationService.notify(eventType as any, payload as any);
      assert.equal(outcome.status, 'failed');
      assert.equal(outcome.deliveries.length, 0);
      assert.equal(await Notification.count({ logging: false, where: { recipientUserId: [alice.userId, bob.userId] } }), 0);
    });
  }

  it('fails on metadata larger than the limit', async () => {
    const metadata = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`k${i}`, 'x'.repeat(500)]));
    const outcome = await NotificationService.notify('GENERAL_NOTIFICATION', {
      recipientUserIds: [alice.userId],
      title: 't',
      message: 'm',
      dedupeKey: uniqueKey('big'),
      metadata,
    });
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.reason, 'metadata_too_large');
    assert.equal((await rowsFor(alice.userId)).length, 0);
  });
});

describe('NotificationService.notify: missing recipients', () => {
  it('skips a user account that does not exist', async () => {
    const outcome = await NotificationService.notify('GENERAL_NOTIFICATION', {
      recipientUserIds: [NON_EXISTENT_USER_ID],
      title: 't',
      message: 'm',
      dedupeKey: uniqueKey('missing-user'),
    });
    assert.equal(outcome.status, 'skipped');
    assert.equal(outcome.reason, 'no_recipients');
  });

  it('skips an employee record that does not exist', async () => {
    const outcome = await NotificationService.notify('LEAVE_APPLIED', {
      leaveId: fakeEntityId(),
      requesterEmployeeId: NON_EXISTENT_EMPLOYEE_ID,
      submittedAt: SUBMITTED_AT,
    });
    assert.equal(outcome.status, 'skipped');
  });

  it('skips an employee with no matching user account (never guesses)', async () => {
    mock.method(Employee, 'findAll', async () => [{ id: 123456, email: 'nobody-has-this-email@example.invalid' }]);
    const resolved = await NotificationRecipients.resolve([{ kind: 'employee', employeeId: 123456 }]);
    assert.deepEqual(resolved.userIds, []);
    assert.deepEqual(resolved.unresolved, [{ ref: { kind: 'employee', employeeId: 123456 }, reason: 'employee_has_no_user' }]);
  });

  it('delivers to resolvable recipients and reports the rest', async () => {
    const resolved = await NotificationRecipients.resolve([
      { kind: 'user', userId: alice.userId },
      { kind: 'user', userId: NON_EXISTENT_USER_ID },
      { kind: 'employee', employeeId: alice.employeeId },
    ]);
    assert.deepEqual(resolved.userIds, [alice.userId]);
    assert.equal(resolved.unresolved.length, 1);
  });
});

describe('NotificationService.notify: idempotency', () => {
  it('does not create a second row for the same event, record and recipient', async () => {
    const payload = { loanId: fakeEntityId(), requesterEmployeeId: alice.employeeId, submittedAt: SUBMITTED_AT };
    const first = await NotificationService.notify('LOAN_APPROVED', payload);
    const second = await NotificationService.notify('LOAN_APPROVED', payload);
    trackOutcome(first);

    assert.equal(first.status, 'delivered');
    assert.equal(second.status, 'duplicate');
    assert.equal((await rowsFor(alice.userId)).length, 1);
  });

  it('allows different events for the same record', async () => {
    const loanId = fakeEntityId();
    const base = { loanId, requesterEmployeeId: alice.employeeId, submittedAt: SUBMITTED_AT };
    trackOutcome(await NotificationService.notify('LOAN_APPLIED', base));
    trackOutcome(await NotificationService.notify('LOAN_APPROVED', base));
    assert.equal((await rowsFor(alice.userId)).length, 2);
  });

  it('creates exactly one row under concurrent attempts (database-enforced)', async () => {
    const payload = { trainingRequestId: randomUUID(), requesterEmployeeId: alice.employeeId, submittedAt: SUBMITTED_AT };
    const outcomes = await Promise.all(
      Array.from({ length: 10 }, () => NotificationService.notify('TRAINING_APPROVED', payload)),
    );
    outcomes.forEach(trackOutcome);

    const statuses = outcomes.map((o) => o.status);
    assert.equal(statuses.filter((s) => s === 'delivered').length, 1);
    assert.equal(statuses.filter((s) => s === 'duplicate').length, 9);
    assert.equal((await rowsFor(alice.userId)).length, 1);
  });

  it('the database itself rejects a duplicate (recipient, dedupe_key) insert', async () => {
    const values = {
      recipientUserId: alice.userId,
      category: 'GENERAL' as const,
      eventType: 'GENERAL_NOTIFICATION',
      audience: 'DIRECT' as const,
      title: 't',
      message: 'm',
      dedupeKey: uniqueKey('db-unique'),
    };
    const row = await NotificationRepository.create(values);
    track(row.id);
    await assert.rejects(NotificationRepository.create(values), { name: 'SequelizeUniqueConstraintError' });
  });
});

describe('NotificationService.notify: failures never escape', () => {
  it('returns failed (does not throw) when the database write fails', async () => {
    mock.method(NotificationRepository, 'create', async () => {
      throw new Error('simulated database outage');
    });
    const outcome = await NotificationService.notify('LEAVE_APPLIED', {
      leaveId: fakeEntityId(),
      requesterEmployeeId: alice.employeeId,
      submittedAt: SUBMITTED_AT,
    });
    assert.equal(outcome.status, 'failed');
    assert.deepEqual(
      outcome.deliveries.map((d) => d.status),
      ['failed'],
    );
    assert.equal(outcome.deliveries[0].notificationId, undefined, 'a failed delivery is never reported with an id');
  });

  it('returns failed (does not throw) when recipient resolution throws', async () => {
    mock.method(NotificationRecipients, 'resolve', async () => {
      throw new Error('simulated lookup failure');
    });
    const outcome = await NotificationService.notify('LEAVE_APPLIED', {
      leaveId: fakeEntityId(),
      requesterEmployeeId: alice.employeeId,
      submittedAt: SUBMITTED_AT,
    });
    assert.equal(outcome.status, 'failed');
    assert.equal(outcome.reason, 'unexpected_error');
  });

  it('reports partial delivery honestly', async () => {
    const realCreate = NotificationRepository.create;
    mock.method(NotificationRepository, 'create', async (values: any) => {
      if (values.recipientUserId === bob.userId) throw new Error('simulated failure for one recipient');
      return realCreate(values);
    });
    const outcome = await NotificationService.notify('GENERAL_NOTIFICATION', {
      recipientUserIds: [alice.userId, bob.userId],
      title: 't',
      message: 'm',
      dedupeKey: uniqueKey('partial'),
    });
    trackOutcome(outcome);
    assert.equal(outcome.status, 'partial');
    assert.deepEqual(
      outcome.deliveries.map((d) => [d.recipientUserId, d.status]),
      [
        [alice.userId, 'created'],
        [bob.userId, 'failed'],
      ],
    );
  });
});

describe('NotificationService.notifyAfterCommit: transaction safety', () => {
  // The "originating business action" is stood in for by a GENERAL row written inside the transaction,
  // so these tests never write to leave/loan/training/complaint tables.
  const businessAction = (transaction: any, key: string) =>
    Notification.create(
      {
        recipientUserId: bob.userId,
        category: 'GENERAL',
        eventType: 'TEST_BUSINESS_ACTION',
        audience: 'DIRECT',
        title: 'business action',
        message: 'stand-in for a committed business record',
        dedupeKey: key,
      },
      { transaction, logging: false },
    );

  const generalPayload = (key: string) => ({
    recipientUserIds: [alice.userId],
    title: 'After commit',
    message: 'Sent after the transaction committed.',
    dedupeKey: key,
  });

  it('delivers only after the transaction commits', async () => {
    const outcomes: NotifyOutcome[] = [];
    let visibleBeforeCommit = -1;

    await db.transaction(async (transaction) => {
      const action = await businessAction(transaction, uniqueKey('biz'));
      track(action.id);
      NotificationService.notifyAfterCommit(transaction, 'GENERAL_NOTIFICATION', generalPayload(uniqueKey('ac')), (o) =>
        outcomes.push(o),
      );
      await sleep(100);
      visibleBeforeCommit = (await rowsFor(alice.userId)).length; // separate connection: sees committed rows only
    });

    assert.equal(visibleBeforeCommit, 0, 'nothing is dispatched before commit');
    await waitFor(() => outcomes.length === 1);
    trackOutcome(outcomes[0]);
    assert.equal(outcomes[0].status, 'delivered');
    assert.equal((await rowsFor(alice.userId)).length, 1);
  });

  it('delivers nothing when the transaction rolls back', async () => {
    const outcomes: NotifyOutcome[] = [];
    const bizKey = uniqueKey('biz-rollback');

    await assert.rejects(
      db.transaction(async (transaction) => {
        await businessAction(transaction, bizKey);
        NotificationService.notifyAfterCommit(transaction, 'GENERAL_NOTIFICATION', generalPayload(uniqueKey('rb')), (o) =>
          outcomes.push(o),
        );
        throw new Error('business validation failed');
      }),
      /business validation failed/,
    );

    await sleep(300);
    assert.equal(outcomes.length, 0, 'the after-commit hook never ran');
    assert.equal((await rowsFor(alice.userId)).length, 0);
    assert.equal(await Notification.count({ where: { dedupeKey: bizKey }, logging: false }), 0, 'business action rolled back');
  });

  it('a notification failure does not undo or fail the committed business action', async () => {
    mock.method(NotificationRepository, 'create', async () => {
      throw new Error('simulated notification outage');
    });
    const outcomes: NotifyOutcome[] = [];
    const bizKey = uniqueKey('biz-commit');

    // The business transaction must resolve normally even though the notification fails.
    await db.transaction(async (transaction) => {
      // Call the real create for the business row (the mock only affects the repository).
      const action = await businessAction(transaction, bizKey);
      track(action.id);
      NotificationService.notifyAfterCommit(transaction, 'GENERAL_NOTIFICATION', generalPayload(uniqueKey('fail')), (o) =>
        outcomes.push(o),
      );
    });

    await waitFor(() => outcomes.length === 1);
    assert.equal(outcomes[0].status, 'failed');
    assert.equal(await Notification.count({ where: { dedupeKey: bizKey }, logging: false }), 1, 'business action is committed');
    assert.equal((await rowsFor(alice.userId)).length, 0);
  });

  it('an invalid payload after commit is logged and reported, not thrown', async () => {
    const outcomes: NotifyOutcome[] = [];
    await db.transaction(async (transaction) => {
      const action = await businessAction(transaction, uniqueKey('biz-invalid'));
      track(action.id);
      NotificationService.notifyAfterCommit(transaction, 'LEAVE_APPROVED', { leaveId: 1 } as any, (o) => outcomes.push(o));
    });
    await waitFor(() => outcomes.length === 1);
    assert.equal(outcomes[0].status, 'failed');
    assert.equal(outcomes[0].reason, 'invalid_payload');
  });

  it('a throwing onSettled callback does not cause an unhandled rejection', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    let called = false;
    try {
      await db.transaction(async (transaction) => {
        NotificationService.notifyAfterCommit(transaction, 'GENERAL_NOTIFICATION', generalPayload(uniqueKey('cb')), (o) => {
          trackOutcome(o);
          called = true;
          throw new Error('callback bug');
        });
      });
      await waitFor(() => called);
      await sleep(100);
      assert.deepEqual(unhandled, []);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('runs immediately for an already committed transaction and never for a rolled-back one', async () => {
    const committed = await db.transaction();
    await committed.commit();
    const outcomes: NotifyOutcome[] = [];
    NotificationService.notifyAfterCommit(committed, 'GENERAL_NOTIFICATION', generalPayload(uniqueKey('late')), (o) =>
      outcomes.push(o),
    );
    await waitFor(() => outcomes.length === 1);
    trackOutcome(outcomes[0]);
    assert.equal(outcomes[0].status, 'delivered');

    const rolledBack = await db.transaction();
    await rolledBack.rollback();
    const none: NotifyOutcome[] = [];
    NotificationService.notifyAfterCommit(rolledBack, 'GENERAL_NOTIFICATION', generalPayload(uniqueKey('never')), (o) =>
      none.push(o),
    );
    await sleep(200);
    assert.equal(none.length, 0);
  });
});
