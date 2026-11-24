import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { Op } from 'sequelize';
import { Notification } from '../notification.model';
import { NotificationRepository } from '../notification.repository';

afterEach(() => mock.restoreAll());

describe('NotificationRepository independent channels', () => {
  it('filters in-app feeds, unread counts, and read operations from in-app-disabled records', async () => {
    const findAll = mock.method(Notification, 'findAll', async () => [] as any);
    const findOne = mock.method(Notification, 'findOne', async () => null as any);
    const update = mock.method(Notification, 'update', async () => [0] as any);

    await NotificationRepository.findFeedPage(51, { status: 'all', sort: 'desc' }, null, 20);
    await NotificationRepository.countUnreadByCategory(51);
    await NotificationRepository.findOwn(51, 7);
    await NotificationRepository.setReadAt(51, 7, new Date());
    await NotificationRepository.markAllRead(51);

    const feedWhere = findAll.mock.calls[0]!.arguments[0]!.where as any;
    const unreadWhere = findAll.mock.calls[1]!.arguments[0]!.where as any;
    assert.deepEqual(feedWhere[Op.and][1], { inAppEnabled: true });
    assert.equal(unreadWhere.inAppEnabled, true);
    assert.deepEqual(findOne.mock.calls[0]!.arguments[0]!.where, { id: 7, recipientUserId: 51, inAppEnabled: true });
    assert.equal(update.mock.calls.length, 2);
    assert.equal((update.mock.calls[0]!.arguments[1]!.where as any).inAppEnabled, true);
    assert.equal((update.mock.calls[1]!.arguments[1]!.where as any).inAppEnabled, true);
  });

  it('returns only unacknowledged realtime rows and scopes acknowledgements to the recipient and channel', async () => {
    const findAll = mock.method(Notification, 'findAll', async () => [] as any);
    const update = mock.method(Notification, 'update', async () => [1] as any);

    await NotificationRepository.findRealtimePending(51, 20);
    await NotificationRepository.acknowledgeRealtime(51, [7, 8]);

    const pendingWhere = findAll.mock.calls[0]!.arguments[0]!.where as any;
    assert.equal(pendingWhere.recipientUserId, 51);
    assert.equal(pendingWhere.realtimeEnabled, true);
    const pendingAck = pendingWhere.realtimeAcknowledgedAt;
    assert.equal(pendingAck[Reflect.ownKeys(pendingAck)[0]], null);
    const options = update.mock.calls[0]!.arguments[1]! as any;
    assert.equal(options.where.recipientUserId, 51);
    assert.equal(options.where.realtimeEnabled, true);
    const ids = options.where.id;
    assert.deepEqual(ids[Reflect.ownKeys(ids)[0]], [7, 8]);
    const ack = options.where.realtimeAcknowledgedAt;
    assert.equal(ack[Reflect.ownKeys(ack)[0]], null);
  });
});
