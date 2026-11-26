import assert from 'node:assert/strict';
import { after, afterEach, it, mock } from 'node:test';
import { db } from '../../../db';
import { AuditLog } from '../../../audit-log/audit-log.model';
import { EmployeeChangeRequest } from '../../employee/employee-change-request.model';
import { EmployeeDraft } from '../../employee/employee-draft.model';
import { Employee } from '../../employee/employee.model';
import { EmployeeService } from '../../employee/employee.service';
import { HRDocumentDeletionRequestRepository } from '../../hr-document/hr-document-deletion-request.repository';
import { HRDocumentDeletionRequest } from '../../hr-document/hr-document-deletion-request.model';
import { OnboardingController } from '../../onboarding/onboarding.controller';
import { Onboarding } from '../../onboarding/onboarding.model';
import { PayrollController } from '../../payroll/payroll.controller';
import { PayrollService } from '../../payroll/payroll.service';
import { PayrollBatch } from '../../payroll/payroll-batch.model';
import { Payroll } from '../../payroll/payroll.model';
import { JobPosting } from '../../recruitment/job-posting.model';
import { JobPostingController } from '../../recruitment/recruitment.controller';
import { NotificationService } from '../notification.service';

afterEach(() => mock.restoreAll());
after(() => db.close());
const request = { params: { id: '27' }, user: { id: 8 }, body: {} } as any;
const response = { json() {} } as any;
const next = (error?: unknown) => {
  if (error) throw error;
};
const tx = {} as any;
function captureTransaction() {
  mock.method(db, 'transaction', async (callback: any) => callback(tx));
  return mock.method(NotificationService, 'notifyAfterCommit', () => {});
}
function captureDelivery() {
  return mock.method(NotificationService, 'notify', async () => ({ status: 'delivered' }) as any);
}

it('sends an employee maintenance rejection to the persisted maker after commit', async () => {
  const notice = captureTransaction();
  mock.method(EmployeeChangeRequest, 'findByPk', async () => ({ id: 27, requestedBy: 6, status: 'PENDING_APPROVAL' }) as any);
  mock.method(EmployeeChangeRequest, 'update', async () => [1] as any);
  mock.method(EmployeeDraft, 'findOne', async () => ({ previousStatus: 'ACTIVE' }) as any);
  mock.method(Employee, 'update', async () => [1] as any);
  await EmployeeService.rejectMaintenance(27, 8, '');
  assert.deepEqual(notice.mock.calls[0].arguments, [tx, 'EMPLOYEE_MANAGEMENT_REJECTED', { recordId: 27, userId: 6 }]);
});

it('sends the payroll batch decision to its maker only after the transaction', async () => {
  const notice = captureTransaction();
  mock.method(PayrollBatch, 'findByPk', async () => ({ createdBy: 6, status: 'PENDING_APPROVAL' }) as any);
  mock.method(PayrollBatch, 'update', async () => [1] as any);
  mock.method(Payroll, 'update', async () => [1] as any);
  await PayrollService.approveBatch({ id: 27, checkerId: 8, approverNote: '' });
  assert.deepEqual(notice.mock.calls[0].arguments, [tx, 'PAYROLL_APPROVED', { recordId: 27, userId: 6 }]);
});

it('uses the actual override requester and audit occurrence, independently of the original payroll maker', async () => {
  const notice = captureTransaction();
  mock.method(PayrollBatch, 'findByPk', async () => ({ createdBy: 6, status: 'PENDING_OVERRIDE_APPROVAL' }) as any);
  mock.method(PayrollBatch, 'update', async () => [1] as any);
  mock.method(AuditLog, 'findOne', async () => ({ id: 1001, userId: 19 }) as any);
  mock.method(AuditLog, 'create', async () => ({ id: 1002 }) as any);
  await PayrollController.approveOverride(request, response);
  assert.deepEqual(notice.mock.calls[0].arguments, [
    tx,
    'PAYROLL_OVERRIDE_APPROVED',
    { recordId: 27, userId: 19, occurrence: 1001 },
  ]);
});

it('addresses a job posting decision to the persisted creator', async () => {
  const notice = captureDelivery();
  const posting = JobPosting.build({ id: 27, status: 'pending_approval', created_by: 6 } as any);
  mock.method(JobPosting, 'findByPk', async () => posting);
  mock.method(JobPosting, 'update', async () => [1] as any);
  await JobPostingController.approve(request, response, next);
  assert.deepEqual(notice.mock.calls[0].arguments, ['RECRUITMENT_APPROVED', { recordId: 27, userId: 6 }]);
});

it('requests document and folder deletion authorization without including file details', async () => {
  const notice = captureDelivery();
  mock.method(HRDocumentDeletionRequest, 'create', async () => ({ id: 27, requestedBy: 6 }) as any);
  for (const deletionType of ['DOCUMENT', 'FOLDER'] as const) {
    await HRDocumentDeletionRequestRepository.create({
      documentOrFolderId: 'abc',
      deletionType,
      itemName: 'private',
      requestedBy: 6,
    });
  }
  for (const call of notice.mock.calls)
    assert.deepEqual(call.arguments, ['DOCUMENTS_AUTHORIZATION', { recordId: 27, userId: 6 }]);
  assert.equal(notice.mock.calls.length, 2);
});

it('sends an onboarding decision once per successful versioned transition', async () => {
  const notice = captureDelivery();
  mock.method(Onboarding, 'findByPk', async () => ({ id: 27, status: 'submitted', employeeId: 6, decisionVersion: 4 }) as any);
  let affected = 1;
  mock.method(Onboarding, 'update', async (_values: any, options: any) => {
    assert.deepEqual(options.where, { id: 27, status: 'submitted', decisionVersion: 4 });
    return [affected] as any;
  });
  const action = () => OnboardingController.update({ ...request, body: { status: 'approved' } }, response, next);
  await action();
  affected = 0;
  await assert.rejects(action);
  assert.deepEqual(
    notice.mock.calls.map((call) => call.arguments),
    [['ONBOARDING_APPROVED', { recordId: 27, employeeId: 6, occurrence: 5 }]],
  );
});
