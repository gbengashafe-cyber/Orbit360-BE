import assert from 'node:assert/strict';
import { after, afterEach, describe, it, mock } from 'node:test';
import { QueryTypes } from 'sequelize';
import { db } from '../../../db';
import { Employee } from '../../employee/employee.model';
import { JobRolePermissions } from '../../permissions/permission.model';
import { User } from '../../users/user.model';
import { getNotificationEvent } from '../notification.events';
import { Notification } from '../notification.model';
import { NotificationRecipients } from '../notification.recipients';
import { NotificationService } from '../notification.service';
import { cleanupTrackedNotifications, fakeEntityId, track } from './test-helpers';

afterEach(async () => {
  mock.restoreAll();
  await cleanupTrackedNotifications();
});
after(() => db.close());

describe('workflow review delivery', () => {
  it('uses the action permission, limits candidates to active accounts and excludes makers, owners and suspended employees', async () => {
    mock.method(JobRolePermissions, 'findAll', async (options: any) => {
      assert.deepEqual(options.where, { permission: 'APPROVE_COMPLAINTS' });
      return [{ jobRoleId: 14 }] as any;
    });
    mock.method(User, 'findAll', async (options: any) => {
      assert.deepEqual(options.where, { status: 'ACTIVE', jobRoleId: [14] });
      return [1, 2, 3, 4].map((id) => ({ id, email: id + '@test.invalid' })) as any;
    });
    mock.method(
      Employee,
      'findAll',
      async () =>
        [1, 2, 3, 4].map((id) => ({
          id: id + 10,
          email: id + '@test.invalid',
          status: id === 3 ? 'SUSPENDED' : 'ACTIVE',
        })) as any,
    );
    const event = getNotificationEvent('COMPLAINT_AUTHORIZATION')!;
    const payload = { recordId: 29, userId: 1, employeeId: 12 };
    const result = await NotificationRecipients.resolve(event.recipients(payload));
    assert.deepEqual(result.userIds, [4]);
    assert.equal(event.actorUserId(payload), null);
    assert.equal(event.metadata(payload), null);
    assert.equal(event.entity(payload), null);
    assert.equal(event.schema.safeParse({ ...payload, description: 'secret' }).success, false);
  });

  it('skips a missing supervisor without a queue fallback', async () => {
    mock.method(Employee, 'findByPk', async () => null);
    const { userIds } = await NotificationRecipients.resolve([{ kind: 'workflow', supervisorOf: 20 }]);
    assert.deepEqual(userIds, []);
  });

  it('does not notify permission holders without an employee mapping', async () => {
    mock.method(JobRolePermissions, 'findAll', async () => [{ jobRoleId: 14 }] as any);
    mock.method(User, 'findAll', async () => [{ id: 1, email: 'unmapped@test.invalid' }] as any);
    mock.method(Employee, 'findAll', async () => [] as any);
    const result = await NotificationRecipients.resolve([{ kind: 'workflow', permission: 'MANAGE_LOANS' }]);
    assert.deepEqual(result.userIds, []);
  });

  it('keys each loan return by its persisted audit occurrence', () => {
    const event = getNotificationEvent('LOAN_REVIEW')!;
    const p = { recordId: 90, occurrence: 104, employeeId: 22 };
    assert.equal(event.dedupeKey(p), event.dedupeKey({ ...p }));
    assert.notEqual(event.dedupeKey(p), event.dedupeKey({ ...p, occurrence: 105 }));
  });

  it('persists one supervisor notification for a replayed training submission', async (t) => {
    const [pair] = await db.query<{ employeeId: number; userId: number }>(
      `SELECT e.id AS employeeId, u.id AS userId FROM employees e
        JOIN employees supervisor ON supervisor.id = e.supervisor_id AND supervisor.id <> e.id
        JOIN users u ON u.email = supervisor.email AND u.status = 'ACTIVE' AND u.deleted_at IS NULL
        LEFT JOIN notification_preferences p ON p.user_id = u.id AND p.category = 'TRAINING'
        WHERE supervisor.status = 'ACTIVE' AND COALESCE(p.in_app_enabled, 1) = 1 LIMIT 1`,
      { type: QueryTypes.SELECT, logging: false },
    );
    if (!pair) return t.skip('No active linked supervisor with training history enabled');
    const payload = { recordId: String(fakeEntityId()), employeeId: pair.employeeId };
    const created = await NotificationService.notify('TRAINING_SUPERVISOR_REVIEW', payload);
    track(...created.deliveries.map((row) => row.notificationId));
    assert.equal(created.status, 'delivered');
    assert.deepEqual(
      created.deliveries.map((row) => row.recipientUserId),
      [pair.userId],
    );
    const row = await Notification.findByPk(created.deliveries[0].notificationId);
    assert.equal(row?.audience, 'ACTOR_QUEUE');
    assert.equal(row?.readAt, null);
    assert.equal((await NotificationService.notify('TRAINING_SUPERVISOR_REVIEW', payload)).status, 'duplicate');
  });
});
