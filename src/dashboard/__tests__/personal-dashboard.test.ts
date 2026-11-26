import assert from 'node:assert/strict';
import { after, afterEach, describe, it, mock } from 'node:test';
import { db } from '../../db';
import { Employee } from '../../features/employee/employee.model';
import { Leave } from '../../features/leave/leave.model';
import { LeaveBalance } from '../../features/leave/leave-balance.model';
import { Loan } from '../../features/loans/loan.model';
import { TrainingRequest } from '../../features/training/training-request.model';
import { Exit } from '../../features/exit/exit.model';
import { Complaint } from '../../features/complaints/complaint.model';
import { Payroll } from '../../features/payroll/payroll.model';
import { getPersonalDashboard } from '../personal-dashboard.service';
import { authHeadersFor, findUsersWithEmployees, startServer } from '../../features/notifications/__tests__/test-helpers';

afterEach(() => mock.restoreAll());
after(() => db.close());

describe('personal dashboard', () => {
  it('returns no profile when the account has no exact employee match', async () => {
    mock.method(Employee, 'findOne', async (options: any) => {
      assert.deepEqual(options.where, { email: 'missing@example.invalid' });
      return null;
    });
    assert.deepEqual(await getPersonalDashboard('missing@example.invalid'), { employee: null });
  });

  it('scopes every source to the linked employee and treats absent data separately from zero', async () => {
    mock.method(Employee, 'findOne', async () => ({ id: 42, get: () => ({ id: 42 }) }) as any);
    mock.method(LeaveBalance, 'findOne', async (options: any) => {
      assert.equal(options.where.employeeId, 42);
      return null;
    });
    mock.method(Payroll, 'findOne', async (options: any) => {
      assert.equal(options.where.employeeId, 42);
      return null;
    });
    for (const model of [Leave, Loan, TrainingRequest, Exit, Complaint]) {
      mock.method(model, 'count', async (options: any) => {
        assert.equal(options.where.employeeId, 42);
        return 0;
      });
      mock.method(model, 'findAll', async (options: any) => {
        assert.equal(options.where.employeeId, 42);
        assert.equal(options.limit, 5);
        return [];
      });
    }
    const result = await getPersonalDashboard('owner@example.invalid');
    assert.equal(result.leaveBalance, null);
    assert.equal(result.latestPayslip, null);
    assert.equal(result.pendingRequests, 0);
    assert.equal(result.activeLoans, 0);
    assert.deepEqual(result.recentRequests, []);
  });

  it('sorts and limits requests while never including complaint content', async () => {
    mock.method(Employee, 'findOne', async () => ({ id: 42, get: () => ({ id: 42 }) }) as any);
    mock.method(LeaveBalance, 'findOne', async () => ({ remainingDays: 0 }) as any);
    mock.method(Payroll, 'findOne', async () => ({ payPeriod: '2026-11' }) as any);
    const models = [Leave, Loan, TrainingRequest, Exit, Complaint];
    models.forEach((model, index) => {
      mock.method(model, 'count', async () => 1);
      mock.method(
        model,
        'findAll',
        async () =>
          [{ id: index + 1, status: 'pending', createdAt: new Date(Date.UTC(2026, 0, index + 1)), title: 'confidential' }] as any,
      );
    });
    const result = await getPersonalDashboard('owner@example.invalid');
    assert.equal(result.pendingRequests, 5);
    assert.equal(result.recentRequests?.[0].type, 'complaint');
    assert.equal(result.recentRequests?.[0].title, 'Staff complaint');
    assert.equal(JSON.stringify(result).includes('confidential'), false);
    assert.equal(result.leaveBalance, 0);
  });

  it('requires authentication and ignores another employee ID in the request', async () => {
    const [first, second] = await findUsersWithEmployees(2);
    const server = await startServer();
    const url = server.baseUrl.replace('/notifications', '/dashboard/me');
    try {
      assert.equal((await fetch(url)).status, 401);
      const response = await fetch(`${url}?employeeId=${second.employeeId}`, { headers: authHeadersFor(first.userId) });
      assert.equal(response.status, 200);
      const body = (await response.json()) as any;
      assert.equal(body.data.employee.id, first.employeeId);
    } finally {
      await server.close();
    }
  });
});
