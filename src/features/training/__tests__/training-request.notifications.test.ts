import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, afterEach, describe, it, mock } from 'node:test';
import { db } from '../../../db';
import { EmployeeRepository } from '../../employee/employee.repository';
import { NotificationService } from '../../notifications/notification.service';
import { TrainingRequest } from '../training-request.model';
import { TrainingRequestService } from '../training-request.service';

const SUBMITTED_AT = new Date('2026-12-02T10:00:00.000Z');
const REQUEST_ID = '95b4c513-00aa-4b1d-b802-7f79af5a497e';
const notifications: { eventType: string; payload: unknown }[] = [];

const trainingRequest = (overrides: Record<string, unknown> = {}) =>
  TrainingRequest.build({
    id: REQUEST_ID,
    employeeId: 21,
    status: 'PENDING_SUPERVISOR_APPROVAL',
    createdAt: SUBMITTED_AT,
    requestScope: 'TEAM',
    teamMemberIds: [22, 23],
    ...overrides,
  } as any);

const requestData = (requestScope: 'SELF' | 'TEAM' = 'TEAM') => ({
  trainingType: 'TECHNICAL SKILLS',
  priority: 'MEDIUM',
  requestScope,
  trainingTitle: 'Secure coding',
  trainingDescription: 'Secure coding practices',
  businessJustification: 'Required for the role',
  skillsToGain: 'Threat modeling',
  deliveryMethod: 'ONLINE',
  preferredTimeframe: '2027 Q1',
  estimatedDuration: '2 days',
  estimatedCost: 100,
  trainingProvider: 'Orbit Academy',
  ...(requestScope === 'TEAM' ? { numberOfTeamMembers: 2 } : {}),
});

afterEach(() => {
  mock.restoreAll();
  notifications.length = 0;
});

after(() => db.close());

const mockNotification = (status = 'delivered') =>
  mock.method(NotificationService, 'notify', async (eventType: string, payload: any) => {
    notifications.push({ eventType, payload });
    return { eventType, status, deliveries: [] } as any;
  });

describe('training notification integration', () => {
  it('rejects HR review before supervisor approval without writing or notifying', async () => {
    mock.method(TrainingRequest, 'findByPk', async () => trainingRequest() as any);
    const update = mock.method(TrainingRequest, 'update', async () => [1] as any);
    mockNotification();

    await assert.rejects(TrainingRequestService.hrReview(REQUEST_ID, 92, 'APPROVE'), { code: 400 });
    await assert.rejects(TrainingRequestService.hrReview(REQUEST_ID, 92, 'REJECT', 'Reason'), { code: 400 });
    assert.equal(update.mock.calls.length, 0);
    assert.equal(notifications.length, 0);
  });

  it('rejects final approval before HR review without writing or notifying', async () => {
    mock.method(TrainingRequest, 'findByPk', async () => trainingRequest({ status: 'PENDING_HR_REVIEW' }) as any);
    const update = mock.method(TrainingRequest, 'update', async () => [1] as any);
    mockNotification();

    await assert.rejects(TrainingRequestService.finalApproval(REQUEST_ID, 93, true), { code: 400 });
    assert.equal(update.mock.calls.length, 0);
    assert.equal(notifications.length, 0);
  });
  it('accepts the UUID-backed request and notifies only the original TEAM requester', async () => {
    const created = trainingRequest({ id: randomUUID() });
    mock.method(TrainingRequest, 'create', async () => created as any);
    mockNotification('failed'); // Delivery failure must not fail the already-created request.

    const result = await TrainingRequestService.createRequest(requestData('TEAM'), 21);

    assert.equal(result.id, created.id);
    assert.deepEqual(notifications, [
      {
        eventType: 'TRAINING_APPLIED',
        payload: { trainingRequestId: created.id, requesterEmployeeId: 21, submittedAt: SUBMITTED_AT },
      },
      { eventType: 'TRAINING_SUPERVISOR_REVIEW', payload: { recordId: created.id, employeeId: 21 } },
    ]);
    assert.equal('teamMemberIds' in (notifications[0].payload as object), false);
  });

  it('sends TRAINING_REJECTED after supervisor rejection and conditionally guards the source status', async () => {
    const request = trainingRequest();
    mock.method(TrainingRequest, 'findByPk', async () => request as any);
    mock.method(EmployeeRepository, 'readById', async () => ({ supervisorId: 8 }) as any);
    mock.method(TrainingRequest, 'update', async (values: any, options: any) => {
      assert.deepEqual(options.where, { id: REQUEST_ID, status: 'PENDING_SUPERVISOR_APPROVAL' });
      assert.equal(values.status, 'SUPERVISOR_REJECTED');
      return [1] as any;
    });
    mockNotification();

    await TrainingRequestService.supervisorApproval({
      requestId: REQUEST_ID,
      supervisorId: 91,
      supervisorEmployeeId: 8,
      approved: false,
      supervisorNote: 'Not approved',
    });

    assert.equal(notifications[0].eventType, 'TRAINING_REJECTED');
    assert.deepEqual(notifications[0].payload, {
      trainingRequestId: REQUEST_ID,
      requesterEmployeeId: 21,
      submittedAt: SUBMITTED_AT,
      actorUserId: 91,
    });
  });

  it('notifies the HR queue when supervisor approval advances the request', async () => {
    const request = trainingRequest();
    mock.method(TrainingRequest, 'findByPk', async () => request as any);
    mock.method(EmployeeRepository, 'readById', async () => ({ supervisorId: 8 }) as any);
    mock.method(TrainingRequest, 'update', async (values: any) => {
      assert.equal(values.status, 'PENDING_HR_REVIEW');
      return [1] as any;
    });
    mockNotification();

    await TrainingRequestService.supervisorApproval({
      requestId: REQUEST_ID,
      supervisorId: 91,
      supervisorEmployeeId: 8,
      approved: true,
    });

    assert.deepEqual(notifications, [
      { eventType: 'TRAINING_HR_REVIEW', payload: { recordId: REQUEST_ID, employeeId: 21, userId: 91 } },
    ]);
  });

  it('notifies on HR Officer rejection but not on intermediate HR approval', async () => {
    const request = trainingRequest({ status: 'PENDING_HR_REVIEW' });
    mock.method(TrainingRequest, 'findByPk', async () => request as any);
    mock.method(TrainingRequest, 'update', async (values: any, options: any) => {
      assert.deepEqual(options.where, { id: REQUEST_ID, status: 'PENDING_HR_REVIEW' });
      assert.equal(values.status, 'HR_REJECTED');
      return [1] as any;
    });
    mockNotification();

    await TrainingRequestService.hrReview(REQUEST_ID, 92, 'REJECT', 'Not approved');
    assert.equal(notifications[0].eventType, 'TRAINING_REJECTED');

    mock.restoreAll();
    notifications.length = 0;
    const approval = trainingRequest({ status: 'PENDING_HR_REVIEW' });
    mock.method(TrainingRequest, 'findByPk', async () => approval as any);
    mock.method(TrainingRequest, 'update', async (values: any) => {
      assert.equal(values.status, 'PENDING_HR_APPROVAL');
      return [1] as any;
    });
    mockNotification();

    await TrainingRequestService.hrReview(REQUEST_ID, 92, 'APPROVE');
    assert.deepEqual(notifications, [
      { eventType: 'TRAINING_FINAL_APPROVAL', payload: { recordId: REQUEST_ID, employeeId: 21, userId: 92 } },
    ]);
  });

  it('notifies the requester on final HR Manager approval and rejection', async () => {
    const approved = trainingRequest({ status: 'PENDING_HR_APPROVAL' });
    mock.method(TrainingRequest, 'findByPk', async () => approved as any);
    mock.method(TrainingRequest, 'update', async (values: any) => {
      assert.equal(values.status, 'APPROVED');
      return [1] as any;
    });
    mockNotification();

    await TrainingRequestService.finalApproval(REQUEST_ID, 93, true);
    assert.equal(notifications[0].eventType, 'TRAINING_APPROVED');

    mock.restoreAll();
    notifications.length = 0;
    const rejected = trainingRequest({ status: 'PENDING_HR_APPROVAL' });
    mock.method(TrainingRequest, 'findByPk', async () => rejected as any);
    mock.method(TrainingRequest, 'update', async (values: any) => {
      assert.equal(values.status, 'REJECTED');
      return [1] as any;
    });
    mockNotification();

    await TrainingRequestService.finalApproval(REQUEST_ID, 93, false, 'Not approved');
    assert.equal(notifications[0].eventType, 'TRAINING_REJECTED');
    assert.equal((notifications[0].payload as any).requesterEmployeeId, 21);
  });

  it('does not dispatch on a stale decision that loses the conditional status update', async () => {
    const request = trainingRequest();
    mock.method(TrainingRequest, 'findByPk', async () => request as any);
    mock.method(EmployeeRepository, 'readById', async () => ({ supervisorId: 8 }) as any);
    mock.method(TrainingRequest, 'update', async () => [0] as any);
    mockNotification();

    await assert.rejects(
      TrainingRequestService.supervisorApproval({
        requestId: REQUEST_ID,
        supervisorId: 91,
        supervisorEmployeeId: 8,
        approved: false,
        supervisorNote: 'Not approved',
      }),
      { code: 409 },
    );
    assert.equal(notifications.length, 0);
  });

  it('lets the owner delete only a request that is still awaiting supervisor approval', async () => {
    const request = trainingRequest();
    const destroy = mock.method(request, 'destroy', async () => undefined as any);
    mock.method(TrainingRequest, 'findByPk', async () => request as any);

    await TrainingRequestService.deleteRequest({ employeeId: 21, requestId: REQUEST_ID });
    assert.equal(destroy.mock.calls.length, 1);

    mock.restoreAll();
    const reviewedRequest = trainingRequest({ status: 'PENDING_HR_REVIEW' });
    mock.method(TrainingRequest, 'findByPk', async () => reviewedRequest as any);

    await assert.rejects(TrainingRequestService.deleteRequest({ employeeId: 21, requestId: REQUEST_ID }), { code: 400 });
  });
});
