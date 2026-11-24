import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { Notification } from '../notification.model';
import { NotificationPreference } from '../notification-preference.model';
import { NotificationRecipients } from '../notification.recipients';
import { NotificationRepository } from '../notification.repository';
import { NotificationService } from '../notification.service';

afterEach(() => mock.restoreAll());

const dispatch = () =>
  NotificationService.notify('GENERAL_NOTIFICATION', {
    recipientUserIds: [501],
    title: 'Test alert',
    message: 'Channel preference test',
    dedupeKey: `test.channel.${Date.now()}`,
  });

const installStubs = (preference: Record<string, unknown> | null) => {
  const creates: Record<string, unknown>[] = [];
  mock.method(NotificationRecipients, 'resolve', async () => ({ userIds: [501], unresolved: [] }) as any);
  mock.method(NotificationPreference, 'findAll', async () => (preference ? [preference] : []) as any);
  mock.method(NotificationRepository, 'create', async (record: Record<string, unknown>) => {
    creates.push(record);
    return { ...record, id: creates.length } as unknown as Notification;
  });
  return creates;
};

describe('NotificationService independent channel preferences', () => {
  it('defaults missing preferences to both channels enabled', async () => {
    const creates = installStubs(null);
    const outcome = await dispatch();
    assert.equal(outcome.status, 'delivered');
    assert.equal(creates[0].inAppEnabled, true);
    assert.equal(creates[0].realtimeEnabled, true);
  });

  it('supports in-app only and real-time only independently', async () => {
    const cases = [
      { inAppEnabled: true, realtimeEnabled: false },
      { inAppEnabled: false, realtimeEnabled: true },
    ];

    for (const values of cases) {
      mock.restoreAll();
      const creates = installStubs({ userId: 501, category: 'GENERAL', ...values });
      const outcome = await dispatch();
      assert.equal(outcome.status, 'delivered');
      assert.equal(creates.length, 1);
      assert.equal(creates[0].inAppEnabled, values.inAppEnabled);
      assert.equal(creates[0].realtimeEnabled, values.realtimeEnabled);
      assert.equal(creates[0].realtimeAcknowledgedAt, null);
    }
  });

  it('creates no delivery record when both channels are disabled', async () => {
    const creates = installStubs({ userId: 501, category: 'GENERAL', inAppEnabled: false, realtimeEnabled: false });
    const outcome = await dispatch();
    assert.equal(outcome.status, 'skipped');
    assert.equal(outcome.deliveries[0].status, 'skipped');
    assert.equal(creates.length, 0);
  });
});
