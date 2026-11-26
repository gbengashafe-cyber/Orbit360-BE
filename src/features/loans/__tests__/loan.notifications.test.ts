import assert from 'node:assert/strict';
import { after, afterEach, describe, it, mock } from 'node:test';
import { AuditLog } from '../../../audit-log/audit-log.model';
import { db } from '../../../db';
import { EmployeeService } from '../../employee/employee.service';
import { EmployeeRepository } from '../../employee/employee.repository';
import { NotificationService } from '../../notifications/notification.service';
import { LoanService } from '../loan-service';
import { Loan } from '../loan.model';
import { LoanRepository } from '../loan.repository';
import { LoanType } from '../loan-types/loan-types.model';

const SUBMITTED_AT = new Date('2026-12-02T10:00:00.000Z');
const TX = { id: 'loan-test-transaction' } as any;
const afterCommitCalls: { transaction: unknown; eventType: string; payload: unknown }[] = [];

const loanRecord = (overrides: Record<string, unknown> = {}) =>
  Loan.build({
    id: 611,
    employeeId: 21,
    loanTypeId: 4,
    principalAmount: 1000,
    interestRate: 2,
    tenureMonths: 6,
    startDate: '2026-12-02',
    status: 'PENDING_APPROVAL',
    nextStep: 'ACTIVE',
    reviewerDecision: 'APPROVE',
    reviewedBy: 44,
    createdAt: SUBMITTED_AT,
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

describe('loan notification integration', () => {
  it('notifies the requester after loan and audit records are created in the transaction', async () => {
    const created = loanRecord({ status: 'PENDING_REVIEW' });
    const employee = { id: 21, status: 'ACTIVE', hireDate: new Date('2020-01-01') } as any;
    mockTransaction();
    mockAfterCommit();
    mock.method(EmployeeRepository, 'readById', async () => employee);
    mock.method(LoanType, 'findByPk', async () => ({ id: 4, interestRate: 2, maxTenureMonths: 12, name: 'Standard' }) as any);
    mock.method(LoanRepository, 'create', async () => created as any);
    mock.method(AuditLog, 'create', async () => ({ id: 321 }) as any);

    await EmployeeService.createLoanRequest({
      employeeId: 21,
      userId: 91,
      loan: {
        loanTypeId: 4,
        principalAmount: 1000,
        interestRate: 2,
        tenureMonths: 6,
        startDate: '2026-12-02',
      } as any,
    });

    assert.deepEqual(afterCommitCalls, [
      {
        transaction: TX,
        eventType: 'LOAN_APPLIED',
        payload: { loanId: 611, requesterEmployeeId: 21, submittedAt: SUBMITTED_AT, actorUserId: 91 },
      },
      { transaction: TX, eventType: 'LOAN_REVIEW', payload: { recordId: 611, employeeId: 21, userId: 91 } },
    ]);
  });

  it('does not notify for an intermediate reviewer rejection that remains pending approval', async () => {
    const loan = loanRecord({ status: 'PENDING_REVIEW', nextStep: 'PENDING_APPROVAL' });
    let values: any;
    mockTransaction();
    mockAfterCommit();
    mock.method(LoanRepository, 'readById', async () => loan as any);
    mock.method(Loan, 'update', async (updateValues: any, options: any) => {
      values = updateValues;
      assert.deepEqual(options.where, { id: 611, status: 'PENDING_REVIEW' });
      return [1] as any;
    });
    mock.method(AuditLog, 'create', async () => ({ id: 321 }) as any);

    await LoanService.reviewLoanRequest({
      employeeId: 8,
      loanId: 611,
      reviewerId: 44,
      payload: { reviewerDecision: 'REJECT', reviewerNote: 'Needs correction' },
    });

    assert.equal(values.status, 'PENDING_APPROVAL');
    assert.equal(values.nextStep, 'REJECTED');
    assert.deepEqual(afterCommitCalls, [
      {
        transaction: TX,
        eventType: 'LOAN_AUTHORIZATION',
        payload: { recordId: 611, employeeId: 21, userId: 44, occurrence: 321 },
      },
    ]);
  });

  it('sends LOAN_APPROVED only when final approval reaches PENDING_DISBURSEMENT', async () => {
    const loan = loanRecord({ status: 'PENDING_APPROVAL', reviewerDecision: 'APPROVE' });
    mockTransaction();
    mockAfterCommit();
    mock.method(LoanRepository, 'readById', async () => loan as any);
    mock.method(Loan, 'update', async (values: any, options: any) => {
      assert.equal(values.status, 'PENDING_DISBURSEMENT');
      assert.deepEqual(options.where, { id: 611, status: 'PENDING_APPROVAL' });
      return [1] as any;
    });
    mock.method(AuditLog, 'create', async () => ({ id: 321 }) as any);

    await LoanService.approveLoanReview({ loanId: 611, approverId: 91, userEmployeeId: 8, approverNote: '' });

    assert.deepEqual(
      afterCommitCalls.map(({ transaction, eventType, payload }) => ({ transaction, eventType, payload })),
      [
        {
          transaction: TX,
          eventType: 'LOAN_APPROVED',
          payload: { loanId: 611, requesterEmployeeId: 21, submittedAt: SUBMITTED_AT, actorUserId: 91 },
        },
      ],
    );
  });

  it('sends LOAN_REJECTED only for the final REJECTED status', async () => {
    const loan = loanRecord({ status: 'PENDING_APPROVAL', reviewerDecision: 'REJECT' });
    mockTransaction();
    mockAfterCommit();
    mock.method(LoanRepository, 'readById', async () => loan as any);
    mock.method(Loan, 'update', async (values: any) => {
      assert.equal(values.status, 'REJECTED');
      return [1] as any;
    });
    mock.method(AuditLog, 'create', async () => ({ id: 321 }) as any);

    await LoanService.approveLoanReview({ loanId: 611, approverId: 91, userEmployeeId: 8, approverNote: '' });

    assert.deepEqual(
      afterCommitCalls.map((call) => call.eventType),
      ['LOAN_REJECTED'],
    );
  });

  it('does not notify when approver rejection returns the loan to PENDING_REVIEW', async () => {
    const loan = loanRecord({ status: 'PENDING_APPROVAL' });
    mockTransaction();
    mockAfterCommit();
    mock.method(LoanRepository, 'readById', async () => loan as any);
    mock.method(Loan, 'update', async (values: any, options: any) => {
      assert.equal(values.status, 'PENDING_REVIEW');
      assert.deepEqual(options.where, { id: 611, status: 'PENDING_APPROVAL' });
      return [1] as any;
    });
    mock.method(AuditLog, 'create', async () => ({ id: 321 }) as any);

    await LoanService.rejectLoanReview({ loanId: 611, approverId: 91, userEmployeeId: 8, approverNote: 'Re-review' });

    assert.deepEqual(afterCommitCalls, [
      { transaction: TX, eventType: 'LOAN_REVIEW', payload: { recordId: 611, employeeId: 21, occurrence: 321 } },
    ]);
  });

  it('does not dispatch an outcome when a stale final approval loses its conditional update', async () => {
    const loan = loanRecord({ status: 'PENDING_APPROVAL' });
    mockTransaction();
    mockAfterCommit();
    mock.method(LoanRepository, 'readById', async () => loan as any);
    mock.method(Loan, 'update', async () => [0] as any);

    await assert.rejects(LoanService.approveLoanReview({ loanId: 611, approverId: 91, userEmployeeId: 8, approverNote: '' }), {
      code: 409,
    });
    assert.equal(afterCommitCalls.length, 0);
  });

  it('notifies the requester only after the eligible cancellation update succeeds', async () => {
    const loan = loanRecord({ status: 'PENDING_REVIEW' });
    let changed = false;
    mock.method(LoanRepository, 'readById', async () => loan as any);
    mock.method(Loan, 'update', async (_values: unknown, options: any) => {
      assert.deepEqual(options.where, { id: 611, employeeId: 21, status: ['PENDING_APPROVAL', 'PENDING_REVIEW'] });
      changed = true;
      return [1] as any;
    });
    mock.method(NotificationService, 'notify', async (eventType: string, payload: any) => {
      assert.equal(changed, true);
      assert.equal(eventType, 'LOAN_CANCELLED');
      assert.deepEqual(payload, { loanId: 611, requesterEmployeeId: 21, submittedAt: SUBMITTED_AT });
      return { eventType, status: 'delivered', deliveries: [] } as any;
    });

    await EmployeeService.cancelLoanRequest({ employeeId: 21, loanId: 611 });
  });
});
