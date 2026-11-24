import assert from 'node:assert/strict';
import { after, afterEach, describe, it, mock } from 'node:test';
import { db } from '../../../db';
import { Employee } from '../../employee/employee.model';
import { NotificationService } from '../../notifications/notification.service';
import { Leave } from '../leave.model';
import { LeaveBalance } from '../leave-balance.model';
import { LeaveController } from '../leave.controller';

const SUBMITTED_AT = new Date('2026-12-02T10:00:00.000Z');
const TX = { id: 'leave-test-transaction' } as any;
const afterCommitCalls: { transaction: unknown; eventType: string; payload: unknown }[] = [];

const response = () => {
  const res: any = {};
  res.status = (status: number) => {
    res.statusCode = status;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
};

const leaveRecord = (overrides: Record<string, unknown> = {}) =>
  Leave.build({
    id: 501,
    employeeId: 21,
    status: 'pending',
    startDate: new Date('2026-12-10T00:00:00.000Z'),
    endDate: new Date('2026-12-12T00:00:00.000Z'),
    createdAt: SUBMITTED_AT,
    covering_employee_id: 33,
    ...overrides,
  } as any);

const mockTransaction = () =>
  mock.method(db, 'transaction', async (callback: (transaction: any) => Promise<unknown>) => callback(TX) as any);

const mockAfterCommit = () =>
  mock.method(NotificationService, 'notifyAfterCommit', (transaction: any, eventType: string, payload: unknown) => {
    afterCommitCalls.push({ transaction, eventType, payload });
  });

afterEach(() => {
  mock.restoreAll();
  afterCommitCalls.length = 0;
});

after(() => db.close());

describe('leave notification integration', () => {
  it('notifies the requester after leave submission succeeds', async () => {
    const employee = { id: 21, email: 'ada@example.com' };
    const created = leaveRecord({ id: 501, createdAt: SUBMITTED_AT });
    const notifyCalls: { eventType: string; payload: unknown }[] = [];
    mock.method(Employee, 'findOne', async () => employee as any);
    mock.method(Leave, 'create', async () => created as any);
    mock.method(Leave, 'findByPk', async () => created as any);
    mock.method(LeaveBalance, 'findOne', async () => null);
    mock.method(NotificationService, 'notify', async (eventType: string, payload: any) => {
      notifyCalls.push({ eventType, payload });
      return { eventType, status: 'delivered', deliveries: [] } as any;
    });

    const req = {
      body: {
        startDate: '2026-12-10',
        endDate: '2026-12-12',
        type: 'annual',
        covering_employee_id: 33,
      },
      files: [],
      user: { id: 91, email: employee.email },
    } as any;
    const res = response();

    await LeaveController.create(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(notifyCalls, [
      {
        eventType: 'LEAVE_APPLIED',
        payload: { leaveId: 501, requesterEmployeeId: 21, submittedAt: SUBMITTED_AT, actorUserId: 91 },
      },
    ]);
  });

  it('notifies the requester and assigned reliever only after approved state transition', async () => {
    const leave = leaveRecord();
    const dispatchOrder: string[] = [];
    mockTransaction();
    mock.method(Leave, 'findByPk', async () => leave as any);
    mock.method(Employee, 'findByPk', async () => ({ id: 21, supervisorId: 8, firstName: 'Ada', lastName: 'Obi' }) as any);
    mock.method(Leave, 'update', async (_values: unknown, options: any) => {
      dispatchOrder.push(`leave:${options.where.status}`);
      return [1] as any;
    });
    mock.method(Employee, 'update', async () => [1] as any);
    mock.method(NotificationService, 'notifyAfterCommit', (transaction: any, eventType: string, payload: any) => {
      afterCommitCalls.push({ transaction, eventType, payload });
      dispatchOrder.push(`notify:${eventType}`);
    });

    await LeaveController.approveOrDecline(
      { params: { id: '501' }, body: { action: 'approved' }, user: { id: 91, employeeRecord: { id: 8 } } } as any,
      response(),
    );

    assert.deepEqual(dispatchOrder, ['leave:pending', 'notify:LEAVE_APPROVED', 'notify:RELIEVER_ASSIGNED']);
    assert.deepEqual(
      afterCommitCalls.map(({ transaction, eventType, payload }) => ({ transaction, eventType, payload })),
      [
        {
          transaction: TX,
          eventType: 'LEAVE_APPROVED',
          payload: { leaveId: 501, requesterEmployeeId: 21, submittedAt: SUBMITTED_AT, actorUserId: 91 },
        },
        {
          transaction: TX,
          eventType: 'RELIEVER_ASSIGNED',
          payload: {
            leaveId: 501,
            relieverEmployeeId: 33,
            onLeaveEmployeeName: 'Ada Obi',
            startDate: new Date('2026-12-10T00:00:00.000Z'),
            endDate: new Date('2026-12-12T00:00:00.000Z'),
            actorUserId: 91,
          },
        },
      ],
    );
  });

  it('does not notify when the covering employee is not assigned', async () => {
    const leave = leaveRecord({ covering_employee_id: null });
    mockTransaction();
    mockAfterCommit();
    mock.method(Leave, 'findByPk', async () => leave as any);
    mock.method(Employee, 'findByPk', async () => ({ id: 21, supervisorId: 8, firstName: 'Ada', lastName: 'Obi' }) as any);
    mock.method(Leave, 'update', async () => [1] as any);
    mock.method(Employee, 'update', async () => [1] as any);

    await LeaveController.approveOrDecline(
      { params: { id: '501' }, body: { action: 'approved' }, user: { id: 91, employeeRecord: { id: 8 } } } as any,
      response(),
    );

    assert.deepEqual(
      afterCommitCalls.map((call) => call.eventType),
      ['LEAVE_APPROVED'],
    );
  });

  it('sends rejection after the pending leave update and suppresses stale decisions', async () => {
    const leave = leaveRecord({ covering_employee_id: null });
    mockTransaction();
    mockAfterCommit();
    mock.method(Leave, 'findByPk', async () => leave as any);
    mock.method(Employee, 'findByPk', async () => ({ id: 21, supervisorId: 8 }) as any);
    mock.method(Leave, 'update', async (_values: unknown, options: any) => {
      assert.deepEqual(options.where, { id: 501, status: 'pending' });
      return [1] as any;
    });

    await LeaveController.approveOrDecline(
      { params: { id: '501' }, body: { action: 'rejected' }, user: { id: 91, employeeRecord: { id: 8 } } } as any,
      response(),
    );
    assert.deepEqual(
      afterCommitCalls.map((call) => call.eventType),
      ['LEAVE_REJECTED'],
    );

    afterCommitCalls.length = 0;
    mock.restoreAll();
    mockTransaction();
    mockAfterCommit();
    mock.method(Leave, 'findByPk', async () => leave as any);
    mock.method(Employee, 'findByPk', async () => ({ id: 21, supervisorId: 8 }) as any);
    mock.method(Leave, 'update', async () => [0] as any);

    await assert.rejects(
      LeaveController.approveOrDecline(
        { params: { id: '501' }, body: { action: 'approved' }, user: { id: 91, employeeRecord: { id: 8 } } } as any,
        response(),
      ),
      { code: 409 },
    );
    assert.equal(afterCommitCalls.length, 0);
  });

  it('sends cancellation only after deletion succeeds', async () => {
    const leave = leaveRecord({ covering_employee_id: null });
    let deleted = false;
    mock.method(Leave, 'findByPk', async () => leave as any);
    mock.method(leave, 'destroy', async () => {
      deleted = true;
      return leave as any;
    });
    mock.method(NotificationService, 'notify', async (eventType: string, payload: any) => {
      assert.equal(deleted, true);
      assert.equal(eventType, 'LEAVE_CANCELLED');
      assert.deepEqual(payload, { leaveId: 501, requesterEmployeeId: 21, submittedAt: SUBMITTED_AT, actorUserId: 91 });
      return { eventType, status: 'delivered', deliveries: [] } as any;
    });

    await LeaveController.cancel({ params: { id: '501' }, user: { id: 91 } } as any, response());
  });
});
