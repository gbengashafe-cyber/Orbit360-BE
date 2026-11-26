import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { AuditLog } from '../../../audit-log/audit-log.model';
import { db } from '../../../db';
import { Employee } from '../../employee/employee.model';
import { NotificationService } from '../../notifications/notification.service';
import { Complaint } from '../complaint.model';
import { ComplaintRepository } from '../complaint.repository';
import { ComplaintService } from '../complaint.service';

const user = { id: 90, email: 'reviewer@example.test', permissions: ['MANAGE_COMPLAINTS', 'APPROVE_COMPLAINTS'] };
const tx = {} as any;
const makeComplaint = (status = 'PENDING_REVIEW') =>
  ({
    id: 44,
    employeeId: 7,
    reference: 'CMP-2026-000044',
    reportedDate: new Date('2026-11-20T10:00:00.000Z'),
    createdAt: new Date('2026-11-20T10:00:00.000Z'),
    complaintType: 'safety',
    title: 'Private title',
    description: 'Private description',
    isAnonymous: true,
    status,
    reviewerNote: 'Private reviewer note',
    reviewedBy: 22,
  }) as unknown as Complaint;

const installTransaction = () => mock.method(db, 'transaction', async (callback: any) => callback(tx) as any);
const installNotification = () => mock.method(NotificationService, 'notifyAfterCommit', (() => undefined) as any);
const installCommon = (viewerEmployeeId: number | null = null) => {
  installTransaction();
  mock.method(Employee, 'findOne', async () => (viewerEmployeeId ? { id: viewerEmployeeId } : null) as any);
  mock.method(AuditLog, 'create', async () => ({}) as any);
  return installNotification();
};

afterEach(() => mock.restoreAll());

describe('complaint notification integration', () => {
  it('registers submission for the complaint owner after the submission transaction work', async () => {
    const notification = installCommon(7);
    const created = makeComplaint();
    mock.method(ComplaintRepository, 'create', async () => created);
    mock.method(ComplaintRepository, 'setReference', async () => [1] as any);

    await ComplaintService.submit(
      { id: 7, email: 'owner@example.test' },
      {
        complaintType: 'safety',
        severity: 'high',
        title: 'Private title',
        description: 'Private description',
        isAnonymous: true,
      },
    );

    assert.equal(notification.mock.calls.length, 2);
    assert.deepEqual(notification.mock.calls[1].arguments, [tx, 'COMPLAINT_REVIEW', { recordId: 44, employeeId: 7, userId: 7 }]);
    const [transaction, event, payload] = notification.mock.calls[0].arguments as any[];
    assert.equal(transaction, tx);
    assert.equal(event, 'COMPLAINT_SUBMITTED');
    assert.deepEqual(payload, {
      complaintId: 44,
      ownerEmployeeId: 7,
      reference: 'CMP-2026-000044',
      submittedAt: created.reportedDate,
    });
    assert.equal('actorUserId' in payload, false);
    assert.equal('isAnonymous' in payload, false);
    assert.equal('description' in payload, false);
  });

  it('notifies the owner on HR Officer rejection but not intermediate approval', async () => {
    const notification = installCommon();
    mock.method(ComplaintRepository, 'findById', async () => makeComplaint());
    mock.method(ComplaintRepository, 'transition', async () => 1);

    await ComplaintService.review(user, 44, { decision: 'REJECT', note: 'private note' });
    assert.equal(notification.mock.calls.length, 1);
    assert.equal(notification.mock.calls[0].arguments[1], 'COMPLAINT_REJECTED');

    mock.restoreAll();
    const noNotification = installCommon();
    mock.method(ComplaintRepository, 'findById', async () => makeComplaint());
    mock.method(ComplaintRepository, 'transition', async () => 1);
    await ComplaintService.review(user, 44, { decision: 'APPROVE' });
    assert.deepEqual(
      noNotification.mock.calls.map((call) => call.arguments),
      [[tx, 'COMPLAINT_AUTHORIZATION', { recordId: 44, employeeId: 7, userId: 90 }]],
    );
  });

  it('notifies the owner after HR Manager final approval or rejection only', async () => {
    for (const [decision, expected] of [
      ['APPROVE', 'COMPLAINT_APPROVED'],
      ['REJECT', 'COMPLAINT_REJECTED'],
    ] as const) {
      mock.restoreAll();
      const notification = installCommon();
      mock.method(ComplaintRepository, 'findById', async () => makeComplaint('PENDING_APPROVAL'));
      mock.method(ComplaintRepository, 'transition', async () => 1);
      await ComplaintService.decide(user, 44, { decision, note: 'private note' });

      assert.equal(notification.mock.calls.length, 1);
      const [, event, payload] = notification.mock.calls[0].arguments as any[];
      assert.equal(event, expected);
      assert.equal(payload.ownerEmployeeId, 7);
      assert.equal('actorUserId' in payload, false);
      assert.equal('isAnonymous' in payload, false);
      assert.equal('description' in payload, false);
      assert.equal('reviewerNote' in payload, false);
    }
  });

  it('does not register a notification when the conditional transition loses a race', async () => {
    const notification = installCommon();
    mock.method(ComplaintRepository, 'findById', async () => makeComplaint());
    mock.method(ComplaintRepository, 'transition', async () => 0);

    await assert.rejects(ComplaintService.review(user, 44, { decision: 'REJECT' }));
    assert.equal(notification.mock.calls.length, 0);
  });
});
