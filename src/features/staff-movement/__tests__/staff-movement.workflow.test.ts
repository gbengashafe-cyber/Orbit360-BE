import assert from 'node:assert/strict';
import { after, before, mock, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { Model, QueryTypes } from 'sequelize';
import { db } from '../../../db';
import { Company } from '../../company/company.model';
import { Department } from '../../department/department.model';
import { JobRole } from '../../job-role/job-role.model';
import { User } from '../../users/user.model';
import { Employee } from '../../employee/employee.model';
import { JobRolePermissions } from '../../permissions/permission.model';
import { NotificationService } from '../../notifications/notification.service';
import { MovementAudit, MovementCategory, MovementRequest, MovementRequestDetail } from '../staff-movement.models';
import { REQUIRED_APPROVAL_STAGES, stageAuthority } from '../staff-movement.foundation';
import { StaffMovementService, Stage } from '../staff-movement.service';
import { applyCommand, createDraft, listRequests, readRequest } from '../staff-movement.requests';
import { paths, requiredAdditional } from '../staff-movement.intake';
import { env } from '../../../config/env';
import { startServer, authHeadersFor } from '../../notifications/__tests__/test-helpers';

type Actor = { id: number; employee: number; department: number };
const users: Record<string, Actor> = {};
const tag = randomUUID().slice(0, 7);
const dates = { startsOn: '2020-01-01', endsOn: '2099-12-31' };
const fixtures = { company: 0, otherCompany: 0, current: 0, receiving: 0, other: 0, designation: 0 };
const categories: number[] = [],
  grants: number[] = [],
  roleIds: number[] = [],
  userIds: number[] = [];
const fields = (keys: string) => Object.fromEntries(keys.split(' ').map((key) => [key, 'Verified in isolated fixture']));
const evidence: Record<string, object> = {
  HR_PRELIMINARY: fields(
    'eligibility headcount position competency pendingMatters compensation policy manualVerification recommendation',
  ),
  CURRENT_HOD: {
    ...fields('handover outstandingResponsibilities replacement operationalRisks conditions'),
    earliestRelease: '2090-02-01',
  },
  RECEIVING_HOD: {
    ...fields('responsibilities jobDescription reporting suitability costCentre kpis training conditions'),
    resumption: '2090-02-01',
  },
  HR_RECOMMENDATION: { ...fields('recommendation conditions policyExceptions compensation'), handoverDeadline: '2090-01-25' },
};
const form = () => ({
  departmentId: fixtures.receiving,
  designationId: fixtures.designation,
  managerId: users.receiver.employee,
  effectiveDate: '2090-02-01',
  duration: 'PERMANENT' as const,
  reason: 'Transfer',
  justification: 'Staffing',
  replacementRequired: false,
  compensationImplication: true,
  gradeChange: false,
  legalEntityChange: false,
  policyException: false,
  directiveReference: 'Synthetic direction',
});
const manage = <T>(fn: (s: StaffMovementService) => Promise<T>) => StaffMovementService.configure(users.manager.id, fn);
const matrix = (): Stage[] =>
  [...REQUIRED_APPROVAL_STAGES, 'EXECUTIVE', 'FINANCIAL'].map((stageCode) => ({
    stageCode,
    authority: stageAuthority[stageCode],
    scope: stageCode.endsWith('HOD') ? 'DEPARTMENT' : 'ORGANIZATION',
    mandatory: !(stageCode === 'EXECUTIVE' || stageCode === 'FINANCIAL'),
    settings: stageCode === 'EXECUTIVE' || stageCode === 'FINANCIAL' ? { whenAny: ['compensationImplication'] } : {},
  }));
const submitDraft = (who: string, path: string, categoryId = categories[0], data = form()) =>
  createDraft(users[who].id, { employeeId: users.subject.employee, categoryId, path, form: data });
const run = (who: string, req: { id: number; revision: number }, action: string, extra: object = {}) =>
  applyCommand(users[who].id, req.id, { revision: req.revision, action, ...extra });
const actors = [
  'manager',
  'subject',
  'hr',
  'alternate',
  'current',
  'receiver',
  'head',
  'executive',
  'finance',
  'delegate',
  'outside',
] as const;
const outstanding = new Set<Promise<unknown>>();
const deliver = NotificationService.notify.bind(NotificationService);
before(async () => {
  mock.method(NotificationService, 'notify', (...args: Parameters<typeof NotificationService.notify>) => {
    const delivery = deliver(...args);
    outstanding.add(delivery);
    void delivery.finally(() => outstanding.delete(delivery));
    return delivery;
  });
  assert.equal(env.DB_NAME, 'orbit360_dev');
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(env.DB_HOST_NAME));
  fixtures.company = (await Company.create({ name: 'Movement ' + tag })).id;
  fixtures.otherCompany = (await Company.create({ name: 'Other ' + tag })).id;
  fixtures.current = (await Department.create({ name: 'Source', companyId: fixtures.company })).id;
  fixtures.receiving = (await Department.create({ name: 'Target', companyId: fixtures.company })).id;
  fixtures.other = (await Department.create({ name: 'Other', companyId: fixtures.otherCompany })).id;
  for (const [i, name] of actors.entries()) {
    const department = name === 'outside' ? fixtures.other : name === 'receiver' ? fixtures.receiving : fixtures.current;
    const job = (await JobRole.create({ departmentId: department, title: name + ' ' + tag })).id;
    roleIds.push(job);
    if (name === 'receiver') fixtures.designation = job;
    const email = tag + i + '@example.invalid';
    const user = await User.create({
      email,
      firstName: 'Test',
      lastName: name,
      password: 'fixture',
      departmentId: department,
      jobRoleId: job,
      status: 'ACTIVE',
    });
    userIds.push(user.id);
    await db.query(
      "INSERT INTO employees (company_id,department_id,job_role_id,created_by,staff_id,email,first_name,last_name,phone,dob,hire_date,annual_basic_salary,nhf_applicable,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'Test','Fixture','000','1990-01-01','2020-01-01',0,0,'ACTIVE',NOW(),NOW())",
      { replacements: [name === 'outside' ? fixtures.otherCompany : fixtures.company, department, job, user.id, tag + i, email] },
    );
    users[name] = { id: user.id, department, employee: (await Employee.findOne({ where: { email } }))!.id };
    const permission =
      name === 'manager'
        ? 'MANAGE_STAFF_MOVEMENT_CONFIGURATION'
        : ['head', 'executive', 'finance'].includes(name)
          ? 'APPROVE_STAFF_MOVEMENT'
          : 'REVIEW_STAFF_MOVEMENT';
    if (name !== 'subject') await JobRolePermissions.create({ jobRoleId: job, permission });
  }
  for (const [name, authority] of [
    ['hr', 'HR_OFFICER'],
    ['head', 'HEAD_OF_HR'],
    ['executive', 'EXECUTIVE'],
    ['finance', 'FINANCIAL'],
  ]) {
    await manage((s) => s.assignApprover({ userId: users[name].id, authority, ...dates }));
  }
  for (const who of ['current', 'receiver'])
    await manage((s) =>
      s.assignHod({ ...dates, employeeId: users[who].employee, departmentId: users[who].department, acting: false }),
    );
  for (const category of await MovementCategory.findAll({ where: { active: true } })) {
    const categoryId = Number(category.get('id'));
    categories.push(categoryId);
    const workflow = await manage((s) => s.createWorkflow(categoryId, 'Workflow ' + tag));
    const wid = Number(workflow.get('id')),
      version = await manage((s) => s.createVersion(wid, matrix(), {}));
    await manage((s) => s.activateVersion(wid, Number(version.get('id'))));
  }
});
after(async () => {
  await Promise.allSettled(outstanding);
  mock.restoreAll();
  try {
    if (fixtures.company && userIds.length)
      await db.transaction(async (transaction) => {
        const del = (table: string, where: string, replacements: Record<string, unknown>) =>
          db.query('DELETE FROM ' + table + ' WHERE ' + where, { replacements, transaction });
        const ids = { users: userIds, company: fixtures.company, other: fixtures.otherCompany, roles: roleIds };
        await del('notifications', 'recipient_user_id IN (:users)', ids);
        await del('sm_audit_events', 'actor_user_id IN (:users)', ids);
        for (const table of ['sm_approval_decisions', 'sm_assignment_snapshots'])
          await del(table, 'request_id IN (SELECT id FROM sm_requests WHERE initiated_by IN (:users))', ids);
        await del('sm_request_details', 'company_id=:company', ids);
        await del('sm_requests', 'initiated_by IN (:users)', ids);
        await del(
          'sm_approval_stages',
          'version_id IN (SELECT v.id FROM sm_workflow_versions v JOIN sm_workflows w ON w.id=v.workflow_id WHERE w.company_id=:company)',
          ids,
        );
        await del('sm_workflow_versions', 'workflow_id IN (SELECT id FROM sm_workflows WHERE company_id=:company)', ids);
        await del('sm_workflows', 'company_id=:company', ids);
        await del('sm_delegations', 'principal_user_id IN (:users)', ids);
        await del('sm_hod_assignments', 'employee_id IN (SELECT id FROM employees WHERE created_by IN (:users))', ids);
        await del('sm_approver_assignments', 'company_id=:company', ids);
        await del('employees', 'created_by IN (:users)', ids);
        await del('users', 'id IN (:users)', ids);
        await del('job_role_permissions', 'job_role_id IN (:roles)', ids);
        await del('job_roles', 'id IN (:roles)', ids);
        await del('departments', 'company_id IN (:company,:other)', ids);
        await del('companies', 'id IN (:company,:other)', ids);
      });
  } finally {
    await db.close();
  }
});

test('own drafts, concurrent create, eight categories, scoped HTTP reads and authoritative data', async () => {
  assert.equal(categories.length, 8);
  const results = await Promise.allSettled([
    submitDraft('subject', 'EMPLOYEE_VOLUNTARY'),
    submitDraft('subject', 'EMPLOYEE_VOLUNTARY'),
  ]);
  const win = results.find((r) => r.status === 'fulfilled');
  assert.ok(win && win.status === 'fulfilled');
  const lose = results.find((r) => r.status === 'rejected');
  assert.equal(lose?.reason.code, 409);
  const draft = win.value;
  const server = await startServer();
  try {
    const url = new URL('/api/v1/staff-movement/requests/' + draft.id, server.baseUrl);
    assert.equal((await fetch(url, { headers: { ...authHeadersFor(users.subject.id), Connection: 'close' } })).status, 200);
    assert.equal((await fetch(url, { headers: { ...authHeadersFor(users.outside.id), Connection: 'close' } })).status, 404);
  } finally {
    await server.close();
  }
  await assert.rejects(submitDraft('outside', 'CURRENT_HOD'));
  await assert.rejects(submitDraft('subject', 'EMPLOYEE_VOLUNTARY', -5));
  await run('subject', draft, 'WITHDRAW');
  for (const category of categories) {
    let current = await submitDraft('subject', 'EMPLOYEE_VOLUNTARY', category);
    const edited = await run('subject', current, 'EDIT', { form: { ...form(), reason: 'Revised' } });
    await assert.rejects(run('subject', current, 'SUBMIT'), { code: 409 });
    await run('subject', edited, 'WITHDRAW');
  }
});

test('routine and conditional approval, stale competitors, immutable versions, notifications and rollback', async (t) => {
  const payroll = () =>
    db.query('SELECT * FROM payrolls WHERE employee_id=? ORDER BY id', {
      replacements: [users.subject.employee],
      type: QueryTypes.SELECT,
    });
  const originalPayroll = await payroll();
  const before = await Employee.findByPk(users.subject.employee, { raw: true });
  const draft = await submitDraft('subject', 'EMPLOYEE_VOLUNTARY');
  const deliveries: Promise<unknown>[] = [];
  const original = NotificationService.notify.bind(NotificationService);
  const dispatch = t.mock.method(NotificationService, 'notify', (...args: Parameters<typeof NotificationService.notify>) => {
    const promise = original(...args);
    deliveries.push(promise);
    return promise;
  });
  try {
    const audit = t.mock.method(MovementAudit, 'create', async () => {
      throw Error('rollback fixture');
    });
    await assert.rejects(run('subject', draft, 'SUBMIT'), /rollback fixture/);
    audit.mock.restore();
    assert.equal(dispatch.mock.callCount(), 0);
    assert.equal((await MovementRequest.findByPk(draft.id))?.get('status'), 'DRAFT');
    const competing = await Promise.allSettled([run('subject', draft, 'SUBMIT'), run('subject', draft, 'SUBMIT')]);
    const accepted = competing.find((result) => result.status === 'fulfilled');
    assert.ok(accepted?.status === 'fulfilled');
    assert.equal(competing.find((result) => result.status === 'rejected')?.reason.code, 409);
    let r = accepted.value;
    await Promise.all(deliveries);
    const replay = await original('MOVEMENT_REVIEW_REQUIRED', { recordId: r.id, occurrence: r.revision, userId: users.hr.id });
    assert.equal(replay.deliveries[0]?.status, 'duplicate');
    assert.match(String(r.reference), /^ORB\/SM\/\d{4}\/\d{4,}$/);
    assert.equal((await listRequests(users.hr.id, { view: 'assigned' })).total, 1);
    const originalVersion = Number((await MovementRequest.findByPk(r.id))!.get('workflowVersionId'));
    const snap = await db.query<{ department: number }>(
      "SELECT JSON_EXTRACT(assignment,'$.departmentId') department FROM sm_assignment_snapshots WHERE request_id=? AND kind='CURRENT'",
      { replacements: [r.id], type: QueryTypes.SELECT },
    );
    assert.equal(Number(snap[0].department), fixtures.current);
    const originalWorkflow = await db.query<{ workflow_id: number }>('SELECT workflow_id FROM sm_workflow_versions WHERE id=?', {
      replacements: [originalVersion],
      type: QueryTypes.SELECT,
    });
    const wid = originalWorkflow[0].workflow_id;
    const replacement = await manage((s) => s.createVersion(wid, matrix(), {}));
    await manage((s) => s.activateVersion(wid, Number(replacement.get('id'))));
    const contenders = await Promise.allSettled([1, 2].map(() => run('hr', r, 'FORWARD', { evidence: evidence.HR_PRELIMINARY })));
    assert.equal(contenders.filter((v) => v.status === 'fulfilled').length, 1);
    const winner = contenders.find((v) => v.status === 'fulfilled')!;
    if (winner.status !== 'fulfilled') throw Error();
    r = winner.value;
    await assert.rejects(run('receiver', r, 'ENDORSE', { evidence: evidence.CURRENT_HOD }));
    r = await run('current', r, 'CONDITIONAL_RELEASE', { evidence: evidence.CURRENT_HOD });
    r = await run('receiver', r, 'ACCEPT', { evidence: evidence.RECEIVING_HOD });
    r = await run('hr', r, 'RECOMMEND', { evidence: evidence.HR_RECOMMENDATION });
    r = await run('head', r, 'APPROVE');
    assert.equal(r.status, 'PENDING_ADDITIONAL_APPROVAL');
    await assert.rejects(run('finance', r, 'APPROVE'));
    r = await run('executive', r, 'APPROVE');
    r = await run('finance', r, 'APPROVE');
    assert.equal(r.status, 'APPROVED');
    assert.equal(Number((await MovementRequest.findByPk(r.id))!.get('workflowVersionId')), originalVersion);
    assert.deepEqual(await payroll(), originalPayroll);
    assert.deepEqual(await Employee.findByPk(users.subject.employee, { raw: true }), before);
    await assert.rejects(run('subject', r, 'CANCEL', { comments: 'Invalid actor' }));
    await run('head', r, 'CANCEL', { comments: 'Recorded reason' });
    await Promise.all(deliveries);
    const received = await db.query<{ recipient: number; dedupe_key: string }>(
      "SELECT recipient_user_id recipient,dedupe_key FROM notifications WHERE entity_type='staff_movement' AND entity_id=? AND event_type='MOVEMENT_REVIEW_REQUIRED'",
      { replacements: [String(r.id)], type: QueryTypes.SELECT },
    );
    const expectedRecipients = ['hr', 'current', 'receiver', 'hr', 'head', 'executive', 'finance'].map((name) => users[name].id);
    assert.deepEqual(
      received.map((row) => row.recipient).sort((a, b) => a - b),
      expectedRecipients.sort((a, b) => a - b),
    );
    assert.equal(new Set(received.map((row) => row.dedupe_key)).size, received.length);
    assert.equal(((await readRequest(users.subject.id, r.id)) as { history?: unknown }).history, undefined);
  } finally {
    await Promise.allSettled(deliveries);
    dispatch.mock.restore();
  }
});

test('five paths, initiating HOD endorsement, independent HR appointment and revocation', async () => {
  const channels = {
    EMPLOYEE_VOLUNTARY: 'subject',
    HR_PLANNING: 'hr',
    EXECUTIVE_DIRECTED: 'hr',
    CURRENT_HOD: 'current',
    RECEIVING_HOD: 'receiver',
  };
  for (const path of paths.options) {
    const maker = channels[path];
    let r = await submitDraft(maker, path);
    const hr = maker === 'hr' ? 'alternate' : 'hr';
    if (maker === 'hr') {
      await assert.rejects(run(maker, r, 'SUBMIT'));
      r = await run('manager', r, 'ASSIGN_HR', { hrUserId: users.alternate.id });
    }
    r = await run(maker, r, 'SUBMIT', { evidence: evidence[path] });
    if (maker === 'hr') await assert.rejects(run('hr', r, 'FORWARD', { evidence: evidence.HR_PRELIMINARY }));
    if (path.endsWith('HOD')) {
      r = await run(hr, r, 'FORWARD', { evidence: evidence.HR_PRELIMINARY });
      if (path === 'CURRENT_HOD') {
        assert.equal(r.status, 'PENDING_RECEIVING_HOD');
        await run('receiver', r, 'DECLINE', { comments: 'Reason' });
      } else {
        r = await run('current', r, 'ENDORSE', { evidence: evidence.CURRENT_HOD });
        assert.equal(r.status, 'PENDING_FINAL_HR_REVIEW');
        r = await run(hr, r, 'RECOMMEND', { evidence: evidence.HR_RECOMMENDATION });
        await run('head', r, 'DECLINE', { comments: 'Reason' });
      }
    } else await run(hr, r, 'DECLINE', { comments: 'Reason' });
  }
});

test('objection escalation, resolution, material correction, clarification and nonconditional approval', async () => {
  const grant = await manage((s) =>
    s.createDelegation({
      ...dates,
      scope: 'CURRENT_HOD',
      departmentId: fixtures.current,
      principalUserId: users.current.id,
      delegateUserId: users.delegate.id,
    }),
  );
  const draft = await submitDraft('subject', 'EMPLOYEE_VOLUNTARY', categories[0], { ...form(), compensationImplication: false });
  let r = await run('subject', draft, 'SUBMIT');
  r = await run('hr', r, 'FORWARD', { evidence: evidence.HR_PRELIMINARY });
  assert.ok((await listRequests(users.delegate.id, { view: 'assigned' })).rows.some((row) => row.id === r.id));
  await manage((s) => s.revokeDelegation(Number(grant.get('id'))));
  await assert.rejects(run('delegate', r, 'OBJECT', { comments: 'Revoked grant' }), { code: 403 });
  await manage((s) =>
    s.createDelegation({
      startsOn: '2021-01-01',
      endsOn: '2022-01-01',
      scope: 'CURRENT_HOD',
      departmentId: fixtures.current,
      principalUserId: users.current.id,
      delegateUserId: users.delegate.id,
    }),
  );
  await assert.rejects(run('delegate', r, 'OBJECT', { comments: 'Invalid' }));
  r = await run('current', r, 'OBJECT', { comments: 'Release conflict' });
  r = await run('hr', r, 'ESCALATE', { comments: 'Review objection' });
  r = await run('head', r, 'RESOLVE', { comments: 'Release authorized' });
  r = await run('receiver', r, 'RETURN', { comments: 'Change start date' });
  r = await run('subject', r, 'EDIT', { form: { ...form(), compensationImplication: false, effectiveDate: '2090-03-01' } });
  r = await run('subject', r, 'RESUBMIT');
  assert.equal(r.status, 'PENDING_HR_VALIDATION');
  r = await run('hr', r, 'FORWARD', { evidence: evidence.HR_PRELIMINARY });
  r = await run('current', r, 'ENDORSE', { evidence: evidence.CURRENT_HOD });
  r = await run('receiver', r, 'ACCEPT', { evidence: evidence.RECEIVING_HOD });
  r = await run('hr', r, 'RECOMMEND', { evidence: evidence.HR_RECOMMENDATION });
  r = await run('head', r, 'CLARIFY', { comments: 'Clarify handover' });
  r = await run('hr', r, 'RESUBMIT', { comments: 'Confirmed handover' });
  r = await run('head', r, 'APPROVE');
  assert.equal(r.status, 'APPROVED');
  await run('head', r, 'CANCEL', { comments: 'Fixture complete' });
});

test('conditional stages reject unsupported predicates and missing configured facts', () => {
  const stage = (settings: object) => ({ get: (key: string) => (key === 'settings' ? settings : false) }) as Model;
  assert.throws(() => requiredAdditional(stage({ threshold: 5000 }), form()), /Unsupported/);
  assert.throws(() => requiredAdditional(stage({ whenAny: ['unknownFlag'] }), form()), /conditions/);
  assert.throws(
    () => requiredAdditional(stage({ whenAny: ['policyException'] }), { ...form(), policyException: undefined }),
    /Missing/,
  );
});
