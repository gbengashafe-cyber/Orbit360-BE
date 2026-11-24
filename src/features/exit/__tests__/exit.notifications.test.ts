import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { User } from '../../users/user.model';
import { NotificationService } from '../../notifications/notification.service';
import { Exit } from '../exit.model';
import { ExitController } from '../exit.controller';

const EXIT_ID = '5a58d4dc-7cd9-4e62-9312-6fe61748e16b';
const LAST_WORKING_DATE = new Date('2026-12-31T23:00:00.000Z');
const exitRow = (values: Record<string, unknown> = {}) =>
  ({
    id: EXIT_ID,
    employeeId: 17,
    status: 'submitted',
    finalApprovalStatus: 'pending',
    lastWorkingDate: LAST_WORKING_DATE,
    update: async function (updates: Record<string, unknown>) {
      Object.assign(this, updates);
      return this;
    },
    ...values,
  }) as any;

const response = () => {
  const result: { statusCode?: number; body?: unknown } = {};
  return {
    result,
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  } as any;
};

afterEach(() => mock.restoreAll());

describe('Exit Management notification integration', () => {
  it('notifies the employee named on a newly submitted exit request', async () => {
    const exit = exitRow();
    const notify = mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
    mock.method(Exit, 'create', async () => exit);
    mock.method(User, 'findAll', async () => []);
    const res = response();

    await ExitController.create(
      { body: { employeeId: 17, lastWorkingDate: LAST_WORKING_DATE }, user: { id: 9 } } as any,
      res,
      () => undefined,
    );
    await new Promise<void>((resolve) => setImmediate(resolve));

    assert.equal(res.result.statusCode, 201);
    assert.equal(notify.mock.calls.length, 1);
    assert.deepEqual(notify.mock.calls[0].arguments, [
      'EXIT_APPLIED',
      { exitId: EXIT_ID, requesterEmployeeId: 17, lastWorkingDate: LAST_WORKING_DATE, actorUserId: 9 },
    ]);
  });

  it('notifies the employee after final approval or rejection writes succeed', async () => {
    for (const [action, expectedEvent] of [
      ['approved', 'EXIT_APPROVED'],
      ['rejected', 'EXIT_REJECTED'],
    ] as const) {
      mock.restoreAll();
      const row = exitRow();
      const notify = mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
      mock.method(Exit, 'findByPk', async () => row);
      const res = response();

      await ExitController.approveExit({ params: { id: EXIT_ID }, body: { action }, user: { id: 9 } } as any, res);

      assert.equal(notify.mock.calls.length, 1);
      assert.equal(notify.mock.calls[0].arguments[0], expectedEvent);
      assert.deepEqual(notify.mock.calls[0].arguments[1], {
        exitId: EXIT_ID,
        requesterEmployeeId: 17,
        lastWorkingDate: LAST_WORKING_DATE,
        actorUserId: 9,
      });
    }
  });

  it('notifies the exiting employee after a terminal reviewer rejection, not an intermediate clearance', async () => {
    const row = exitRow();
    const notify = mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
    mock.method(Exit, 'findByPk', async () => row);
    const res = response();

    await ExitController.reviewExit({ params: { id: EXIT_ID }, body: { action: 'rejected' }, user: { id: 9 } } as any, res);
    assert.equal(row.finalApprovalStatus, 'rejected');
    assert.equal(notify.mock.calls.length, 1);
    assert.equal(notify.mock.calls[0].arguments[0], 'EXIT_REJECTED');

    mock.restoreAll();
    const cleared = exitRow();
    const noNotify = mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
    mock.method(Exit, 'findByPk', async () => cleared);
    await ExitController.reviewExit(
      { params: { id: EXIT_ID }, body: { action: 'approved' }, user: { id: 9 } } as any,
      response(),
    );
    assert.equal(cleared.finalApprovalStatus, 'cleared');
    assert.equal(noNotify.mock.calls.length, 0);
  });

  it('does not notify when the exit record write fails', async () => {
    const row = exitRow({
      update: async () => {
        throw new Error('write failed');
      },
    });
    const notify = mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
    mock.method(Exit, 'findByPk', async () => row);

    await assert.rejects(
      ExitController.approveExit({ params: { id: EXIT_ID }, body: { action: 'approved' }, user: { id: 9 } } as any, response()),
    );
    assert.equal(notify.mock.calls.length, 0);
  });

  it('does not notify when exit submission creation fails', async () => {
    const notify = mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
    mock.method(Exit, 'create', async () => {
      throw new Error('write failed');
    });
    const next = mock.fn();

    await ExitController.create({ body: { employeeId: 17 }, user: { id: 9 } } as any, response(), next as any);
    assert.equal(notify.mock.calls.length, 0);
    assert.equal(next.mock.calls.length, 1);
  });

  it('notifies completion through the existing status update endpoint, not for intermediate status edits', async () => {
    const row = exitRow({ status: 'clearance_pending' });
    const notify = mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
    mock.method(Exit, 'findByPk', async () => row);

    await ExitController.update(
      { params: { id: EXIT_ID }, body: { status: 'completed' }, user: { id: 9 } } as any,
      response(),
      () => undefined,
    );
    assert.equal(notify.mock.calls.length, 1);
    assert.equal(notify.mock.calls[0].arguments[0], 'EXIT_COMPLETED');

    mock.restoreAll();
    const intermediate = exitRow({ status: 'submitted' });
    const noNotify = mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
    mock.method(Exit, 'findByPk', async () => intermediate);
    await ExitController.update(
      { params: { id: EXIT_ID }, body: { status: 'under_review' }, user: { id: 9 } } as any,
      response(),
      () => undefined,
    );
    assert.equal(noNotify.mock.calls.length, 0);
  });
});
