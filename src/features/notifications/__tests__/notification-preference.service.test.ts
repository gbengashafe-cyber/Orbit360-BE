import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { db } from '../../../db';
import { Employee } from '../../employee/employee.model';
import { NotificationPreference } from '../notification-preference.model';
import { NotificationPreferenceService } from '../notification-preference.service';

afterEach(() => mock.restoreAll());

describe('NotificationPreferenceService', () => {
  it('provides independent enabled-by-default preferences for employee-facing categories', async () => {
    mock.method(Employee, 'findOne', async () => ({ id: 31 }) as any);
    mock.method(NotificationPreference, 'findAll', async () => []);

    const categories = await NotificationPreferenceService.list({ id: 101, email: 'employee@example.test', permissions: [] });
    assert.deepEqual(
      categories.map(({ category }) => category),
      ['LEAVE', 'LOAN', 'TRAINING', 'RELIEVER', 'COMPLAINT', 'GENERAL', 'EXIT', 'ONBOARDING', 'STAFF_MOVEMENT'],
    );
    assert.ok(categories.every(({ inAppEnabled, realtimeEnabled }) => inAppEnabled && realtimeEnabled));
  });

  it('combines current granular permissions for non-employee accounts', async () => {
    mock.method(Employee, 'findOne', async () => null);
    mock.method(NotificationPreference, 'findAll', async () => []);

    const categories = await NotificationPreferenceService.list({
      id: 202,
      email: 'hr@example.test',
      permissions: ['manage_complaints', 'APPROVE_EXITS', 'LIST_LOANS'],
    });
    assert.deepEqual(
      categories.map(({ category }) => category),
      ['LOAN', 'COMPLAINT', 'GENERAL', 'EXIT'],
    );
  });

  it('recalculates visible categories when the current permission set changes', async () => {
    mock.method(Employee, 'findOne', async () => null);
    mock.method(NotificationPreference, 'findAll', async () => []);
    const user = { id: 212, email: 'manager@example.test' };

    const withPermission = await NotificationPreferenceService.list({ ...user, permissions: ['MANAGE_EXITS'] });
    const afterPermissionRemoval = await NotificationPreferenceService.list({ ...user, permissions: [] });

    assert.ok(withPermission.some(({ category }) => category === 'EXIT'));
    assert.ok(!afterPermissionRemoval.some(({ category }) => category === 'EXIT'));
    assert.deepEqual(
      afterPermissionRemoval.map(({ category }) => category),
      ['GENERAL'],
    );
  });

  it('updates each authenticated user independently while preserving the other channel default', async () => {
    const stored = new Map<string, any>();
    mock.method(Employee, 'findOne', async () => ({ id: 31 }) as any);
    mock.method(db, 'transaction', async (callback: any) => callback({} as any) as any);
    mock.method(NotificationPreference, 'findOrCreate', async ({ where, defaults }: any) => {
      const key = `${where.userId}:${where.category}`;
      if (!stored.has(key)) {
        stored.set(key, {
          ...defaults,
          update: async function (values: Record<string, boolean>) {
            Object.assign(this, values);
          },
        });
      }
      return [stored.get(key), !stored.has(key)] as any;
    });

    const first = await NotificationPreferenceService.update({ id: 101, email: 'first@example.test' }, 'LOAN', {
      inAppEnabled: false,
    });
    const second = await NotificationPreferenceService.update({ id: 202, email: 'second@example.test' }, 'LOAN', {
      realtimeEnabled: false,
    });

    assert.deepEqual(first, { category: 'LOAN', inAppEnabled: false, realtimeEnabled: true });
    assert.deepEqual(second, { category: 'LOAN', inAppEnabled: true, realtimeEnabled: false });
    assert.notEqual(stored.get('101:LOAN'), stored.get('202:LOAN'));
  });

  it('re-evaluates permissions and rejects inaccessible categories without deleting saved preferences', async () => {
    mock.method(Employee, 'findOne', async () => null);
    mock.method(NotificationPreference, 'findAll', async () => []);
    mock.method(db, 'transaction', async () => {
      throw new Error('must not open a write transaction');
    });

    await assert.rejects(
      NotificationPreferenceService.update({ id: 303, email: 'user@example.test', permissions: [] }, 'EXIT', {
        inAppEnabled: false,
      }),
      { code: 403 },
    );
    assert.deepEqual(
      (await NotificationPreferenceService.list({ id: 303, email: 'user@example.test', permissions: [] })).map(
        ({ category }) => category,
      ),
      ['GENERAL'],
    );
  });
});
