import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { db } from '../../../db';
import { ApiError } from '../../../utils/api-error';
import { decodeCursor, encodeCursor } from '../notification.cursor';
import { addDays, formatNotificationDate, startOfLocalDayUtc } from '../notification.dates';
import { getNotificationEvent, NOTIFICATION_EVENT_TYPES, NOTIFICATION_EVENTS } from '../notification.events';

after(() => db.close());

const render = (eventType: string, payload: Record<string, unknown>) => {
  const definition = getNotificationEvent(eventType);
  assert.ok(definition, `${eventType} is registered`);
  const data = definition.schema.parse(payload);
  return { title: definition.title(data), message: definition.message(data), definition, data };
};

// 10:00 UTC on 2 Dec 2026 = 11:00 in Lagos.
const DEC_2 = '2026-12-02T10:00:00.000Z';
const TRAINING_REQUEST_ID = '95b4c513-00aa-4b1d-b802-7f79af5a497e';

describe('notification dates (D1)', () => {
  it('formats DD/MM/YYYY in Africa/Lagos', () => {
    assert.equal(formatNotificationDate(new Date(DEC_2)), '02/12/2026');
    assert.equal(formatNotificationDate(DEC_2), '02/12/2026');
  });

  it('uses the Lagos calendar day, not the UTC day', () => {
    // 23:30 UTC on 1 Dec is 00:30 on 2 Dec in Lagos (UTC+1).
    assert.equal(formatNotificationDate(new Date('2026-12-01T23:30:00Z')), '02/12/2026');
    assert.equal(formatNotificationDate(new Date('2026-12-01T22:59:59Z')), '01/12/2026');
  });

  it('rejects invalid dates', () => {
    assert.throws(() => formatNotificationDate('not-a-date'), RangeError);
  });

  it('computes Lagos day boundaries in UTC', () => {
    assert.equal(startOfLocalDayUtc('2026-12-02').toISOString(), '2026-12-01T23:00:00.000Z');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  });
});

describe('notification cursor', () => {
  const row = { createdAt: new Date('2026-12-02T10:00:00.000Z'), id: 42 };

  it('round-trips (created_at, id) for the same sort order', () => {
    const cursor = encodeCursor(row, 'desc');
    assert.match(cursor, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual(decodeCursor(cursor, 'desc'), row);
  });

  it('rejects a cursor issued for a different sort order', () => {
    assert.throws(
      () => decodeCursor(encodeCursor(row, 'desc'), 'asc'),
      (error: ApiError) => error.code === 400,
    );
  });

  it('rejects malformed cursors', () => {
    const bad = [
      'not base64!',
      Buffer.from('not json').toString('base64url'),
      Buffer.from(JSON.stringify({ v: 1, s: 'desc', t: 'yesterday', i: 1 })).toString('base64url'),
      Buffer.from(JSON.stringify({ v: 1, s: 'desc', t: row.createdAt.toISOString(), i: -5 })).toString('base64url'),
      Buffer.from(JSON.stringify({ v: 2, s: 'desc', t: row.createdAt.toISOString(), i: 5 })).toString('base64url'),
      Buffer.from(JSON.stringify({ v: 1, s: 'desc', t: row.createdAt.toISOString(), i: 5, recipientUserId: 9 })).toString(
        'base64url',
      ),
      'A'.repeat(500),
    ];
    for (const cursor of bad) {
      assert.throws(
        () => decodeCursor(cursor, 'desc'),
        (error: ApiError) => error.code === 400,
        cursor,
      );
    }
  });
});

describe('event registry', () => {
  it('defines the employee-facing Phase 2, Phase 3, and Exit events', () => {
    assert.deepEqual(
      [...NOTIFICATION_EVENT_TYPES].sort((a, b) => a.localeCompare(b)),
      [
        'COMPLAINT_APPROVED',
        'COMPLAINT_REJECTED',
        'COMPLAINT_SUBMITTED',
        'EXIT_APPLIED',
        'EXIT_APPROVED',
        'EXIT_COMPLETED',
        'EXIT_REJECTED',
        'GENERAL_NOTIFICATION',
        'LEAVE_APPLIED',
        'LEAVE_APPROVED',
        'LEAVE_CANCELLED',
        'LEAVE_REJECTED',
        'LOAN_APPLIED',
        'LOAN_APPROVED',
        'LOAN_CANCELLED',
        'LOAN_REJECTED',
        'RELIEVER_ASSIGNED',
        'TRAINING_APPLIED',
        'TRAINING_APPROVED',
        'TRAINING_REJECTED',
      ],
    );
  });

  it('has no approver (ACTOR_QUEUE) or broadcast deliveries (D4)', () => {
    for (const definition of Object.values(NOTIFICATION_EVENTS)) {
      assert.ok(['REQUESTER', 'RELIEVER', 'DIRECT'].includes(definition.audience));
    }
  });

  it('uses the approved copy with dates from the payload', () => {
    const leave = { leaveId: 1, requesterEmployeeId: 2, submittedAt: DEC_2 };
    const loan = { loanId: 1, requesterEmployeeId: 2, submittedAt: DEC_2 };
    const training = { trainingRequestId: TRAINING_REQUEST_ID, requesterEmployeeId: 2, submittedAt: DEC_2 };

    assert.equal(render('LEAVE_APPLIED', leave).message, 'You applied for leave on 02/12/2026. Status: Pending approval.');
    assert.equal(render('LEAVE_APPROVED', leave).message, 'Your leave request submitted on 02/12/2026 has been approved.');
    assert.equal(render('LEAVE_REJECTED', leave).message, 'Your leave request submitted on 02/12/2026 was rejected.');
    assert.equal(render('LOAN_APPROVED', loan).message, 'Your loan request submitted on 02/12/2026 has been approved.');
    assert.equal(render('LOAN_REJECTED', loan).message, 'Your loan request submitted on 02/12/2026 was rejected.');
    assert.equal(render('TRAINING_REJECTED', training).message, 'Your training request submitted on 02/12/2026 was rejected.');
    const reliever = render('RELIEVER_ASSIGNED', {
      leaveId: 1,
      relieverEmployeeId: 3,
      onLeaveEmployeeName: 'Ada Obi',
      startDate: DEC_2,
    });
    assert.equal(reliever.definition.audience, 'RELIEVER');
    assert.deepEqual(reliever.definition.recipients(reliever.data), [{ kind: 'employee', employeeId: 3 }]);
    assert.equal(reliever.message, 'You are covering for Ada Obi starting 02/12/2026.');
  });

  it('uses the discovery report wording for the other events', () => {
    const leave = { leaveId: 1, requesterEmployeeId: 2, submittedAt: DEC_2 };
    const loan = { loanId: 1, requesterEmployeeId: 2, submittedAt: DEC_2 };
    const training = { trainingRequestId: TRAINING_REQUEST_ID, requesterEmployeeId: 2, submittedAt: DEC_2 };
    const complaint = { complaintId: 1, ownerEmployeeId: 2, reference: 'CMP-2026-000001', submittedAt: DEC_2 };

    assert.equal(render('LEAVE_CANCELLED', leave).message, 'Your leave request submitted on 02/12/2026 was cancelled.');
    assert.equal(render('LOAN_APPLIED', loan).message, 'You applied for a loan on 02/12/2026. Status: Pending review.');
    assert.equal(render('LOAN_CANCELLED', loan).message, 'Your loan request submitted on 02/12/2026 was cancelled.');
    assert.equal(
      render('TRAINING_APPLIED', training).message,
      'You submitted a training request on 02/12/2026. Status: Pending supervisor approval.',
    );
    assert.equal(
      render('TRAINING_APPROVED', training).message,
      'Your training request submitted on 02/12/2026 has been approved.',
    );
    assert.equal(
      render('COMPLAINT_SUBMITTED', complaint).message,
      'You submitted a complaint on 02/12/2026 (Ref CMP-2026-000001). Status: Pending review.',
    );
    assert.equal(render('COMPLAINT_APPROVED', complaint).message, 'Your complaint submitted on 02/12/2026 has been approved.');
    assert.equal(render('COMPLAINT_REJECTED', complaint).message, 'Your complaint submitted on 02/12/2026 was rejected.');

    const exit = { exitId: TRAINING_REQUEST_ID, requesterEmployeeId: 2, lastWorkingDate: DEC_2 };
    assert.equal(render('EXIT_APPLIED', exit).message, 'Your exit request with last working date 02/12/2026 has been submitted.');
    assert.equal(render('EXIT_APPROVED', exit).message, 'Your exit request with last working date 02/12/2026 has been approved.');
    assert.equal(render('EXIT_REJECTED', exit).message, 'Your exit request with last working date 02/12/2026 was rejected.');
    assert.equal(
      render('EXIT_COMPLETED', exit).message,
      'Your exit clearance for last working date 02/12/2026 has been completed.',
    );
    const exitApplied = render('EXIT_APPLIED', exit);
    assert.equal(exitApplied.definition.category, 'EXIT');
    assert.deepEqual(exitApplied.definition.recipients(exitApplied.data), [{ kind: 'employee', employeeId: 2 }]);
    assert.deepEqual(exitApplied.definition.entity(exitApplied.data), { type: 'exit', id: TRAINING_REQUEST_ID });
    assert.equal(exitApplied.definition.dedupeKey(exitApplied.data), `EXIT_APPLIED:exit:${TRAINING_REQUEST_ID}`);
  });

  it('stores timestamps (ISO, UTC) in metadata, not formatted strings', () => {
    const { definition, data } = render('LEAVE_APPROVED', { leaveId: 1, requesterEmployeeId: 2, submittedAt: DEC_2 });
    assert.deepEqual(definition.metadata(data), { status: 'APPROVED', submittedAt: DEC_2 });
  });

  it('builds stable per-event dedupe keys', () => {
    const { definition, data } = render('LOAN_APPROVED', { loanId: 77, requesterEmployeeId: 2, submittedAt: DEC_2 });
    assert.equal(definition.dedupeKey(data), 'LOAN_APPROVED:loan:77');
    assert.deepEqual(definition.entity(data), { type: 'loan', id: '77' });
  });

  it('accepts UUID training request IDs and uses them in entity and dedupe keys', () => {
    const definition = getNotificationEvent('TRAINING_APPROVED');
    assert.ok(definition);
    const data = definition.schema.parse({
      trainingRequestId: TRAINING_REQUEST_ID,
      requesterEmployeeId: 2,
      submittedAt: DEC_2,
    });

    assert.deepEqual(definition.entity(data), { type: 'training_request', id: TRAINING_REQUEST_ID });
    assert.equal(definition.dedupeKey(data), `TRAINING_APPROVED:training_request:${TRAINING_REQUEST_ID}`);
    assert.equal(
      definition.schema.safeParse({ trainingRequestId: 'not-a-uuid', requesterEmployeeId: 2, submittedAt: DEC_2 }).success,
      false,
    );
    assert.equal(
      definition.schema.safeParse({ trainingRequestId: 1, requesterEmployeeId: 2, submittedAt: DEC_2 }).success,
      false,
    );
  });

  it('rejects payloads with missing or unknown fields', () => {
    const definition = getNotificationEvent('LEAVE_APPROVED');
    assert.ok(definition);
    assert.equal(definition.schema.safeParse({ leaveId: 1, requesterEmployeeId: 2 }).success, false);
    assert.equal(
      definition.schema.safeParse({ leaveId: 1, requesterEmployeeId: 2, submittedAt: DEC_2, recipientUserId: 5 }).success,
      false,
    );
    assert.equal(getNotificationEvent('NOT_AN_EVENT'), null);
    assert.equal(getNotificationEvent('toString'), null);
  });
});
