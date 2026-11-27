import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { isDeepStrictEqual } from 'node:util';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { User } from '../users/user.model';
import { Employee } from '../employee/employee.model';
import { NotificationService } from '../notifications/notification.service';
import { identity, MovementIdentity, principalFor, hodRole } from './staff-movement.authority';
import { MovementState, REQUIRED_APPROVAL_STAGES } from './staff-movement.foundation';
import {
  MovementApprovalDecision,
  MovementAssignmentSnapshot,
  MovementAudit,
  MovementRequest,
  MovementRequestDetail,
} from './staff-movement.models';
import {
  businessDate,
  createSchema,
  evidenceSchemas,
  Form,
  formSchema,
  id,
  note,
  parse,
  requiredAdditional,
  resolveWorkflow,
  validateIntake,
  validateSubmission,
} from './staff-movement.intake';
import {
  Case,
  currentActorStage,
  departmentFor,
  eligible,
  loadCase,
  loadStages,
  roleAccess,
  stage,
  validateInitiator,
} from './staff-movement.participants';
import { persistMovementTransition } from './staff-movement.transitions';

const statuses: Record<string, MovementState> = {
  HR_PRELIMINARY: 'PENDING_HR_VALIDATION',
  CURRENT_HOD: 'PENDING_CURRENT_HOD',
  RECEIVING_HOD: 'PENDING_RECEIVING_HOD',
  HR_RECOMMENDATION: 'PENDING_FINAL_HR_REVIEW',
  HEAD_OF_HR: 'PENDING_FINAL_APPROVAL',
  EXECUTIVE: 'PENDING_ADDITIONAL_APPROVAL',
  FINANCIAL: 'PENDING_ADDITIONAL_APPROVAL',
};
const verbs = [
  'EDIT',
  'ASSIGN_HR',
  'SUBMIT',
  'WITHDRAW',
  'FORWARD',
  'ENDORSE',
  'CONDITIONAL_RELEASE',
  'OBJECT',
  'ACCEPT',
  'RECOMMEND',
  'APPROVE',
  'RETURN',
  'DECLINE',
  'CLARIFY',
  'ESCALATE',
  'RESOLVE',
  'RESUBMIT',
  'CANCEL',
] as const;
export const commandSchema = z.strictObject({
  revision: id,
  action: z.enum(verbs),
  form: formSchema.optional(),
  hrUserId: id.optional(),
  comments: note.optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
});
type Command = z.infer<typeof commandSchema>;
const actionMap: Record<string, string[]> = {
  HR_PRELIMINARY: ['FORWARD', 'RETURN', 'DECLINE'],
  CURRENT_HOD: ['ENDORSE', 'CONDITIONAL_RELEASE', 'OBJECT'],
  RECEIVING_HOD: ['ACCEPT', 'RETURN', 'DECLINE'],
  HR_RECOMMENDATION: ['RECOMMEND', 'RETURN'],
  HEAD_OF_HR: ['APPROVE', 'RETURN', 'CLARIFY', 'DECLINE', 'ESCALATE'],
  EXECUTIVE: ['APPROVE', 'RETURN', 'CLARIFY', 'DECLINE'],
  FINANCIAL: ['APPROVE', 'RETURN', 'CLARIFY', 'DECLINE'],
};

async function transaction<T>(userId: number, fn: (actor: MovementIdentity, tx: Transaction) => Promise<T>) {
  try {
    return await db.transaction(async (tx) => {
      const actor = await identity(userId, tx);
      if (!actor) throw ApiError.forbidden('Active movement identity required');
      return fn(actor, tx);
    });
  } catch (error) {
    const cause = (error as { original?: { code?: string; sqlMessage?: string } }).original;
    if (cause?.code === 'ER_DUP_ENTRY' && cause.sqlMessage?.includes('sm_request_employee_active_slot_uq'))
      throw ApiError.conflict('An active movement already exists for this employee');
    if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(cause?.code ?? ''))
      throw ApiError.conflict('Movement changed concurrently; reload before retrying');
    throw error;
  }
}
export async function createDraft(userId: number, body: unknown) {
  const input = parse(createSchema, body);
  return transaction(userId, async (actor, tx) => {
    const org = await validateIntake(input.employeeId, actor.employee.companyId, input.form, tx);
    await validateInitiator(input.path, actor, input.employeeId, org.current, org.proposed, tx);
    const versionId = await resolveWorkflow(input.categoryId, actor.employee.companyId, tx);
    const request = await MovementRequest.create(
      {
        employeeId: input.employeeId,
        initiatedBy: userId,
        categoryId: input.categoryId,
        workflowVersionId: versionId,
        status: 'DRAFT',
        revision: 1,
        effectiveDate: input.form.effectiveDate,
      },
      { transaction: tx },
    );
    const requestId = Number(request.get('id'));
    await MovementRequestDetail.create(
      {
        id: requestId,
        companyId: actor.employee.companyId,
        currentDepartmentId: org.current.id,
        proposedDepartmentId: org.proposed.id,
        path: input.path,
        form: input.form,
        routing: { completed: [], additional: [], cycle: 0 },
      },
      { transaction: tx },
    );
    await MovementAudit.create(
      {
        actorUserId: userId,
        resource: 'sm_requests',
        recordId: requestId,
        action: 'CREATE_DRAFT',
        changes: { revision: 1, path: input.path },
      },
      { transaction: tx },
    );
    return { id: requestId, status: 'DRAFT', revision: 1 };
  });
}
async function actions(c: Case) {
  if (c.state.startsWith('PENDING_')) {
    const expected = [...REQUIRED_APPROVAL_STAGES, ...c.route.additional].find((code) => !c.route.completed.includes(code));
    if (!expected || c.route.stage !== expected || statuses[expected] !== c.state)
      throw ApiError.conflict('Movement stage and recorded decisions disagree');
  }
  const a = await roleAccess(c);
  const allowed: string[] = [];
  if (a.assign) allowed.push('ASSIGN_HR');
  if (c.state === 'DRAFT' && a.maker) allowed.push('EDIT', 'SUBMIT', 'WITHDRAW');
  else if (['RETURNED', 'CLARIFICATION'].includes(c.state)) {
    if (c.route.correction === 'HR' ? a.reviewer : a.maker) allowed.push('EDIT', 'RESUBMIT');
    if (c.route.material && hodRole(String(c.detail.get('path'))) && a.maker && !allowed.includes('RESUBMIT'))
      allowed.push('RESUBMIT');
  } else if (a.reviewer) {
    if (c.state === 'APPROVED') allowed.push('CANCEL');
    else if (c.route.objection === 'HR') allowed.push('ESCALATE', 'RETURN');
    else if (c.route.objection === 'HEAD') allowed.push('RESOLVE', 'RETURN');
    else allowed.push(...(actionMap[c.route.stage ?? ''] ?? []));
  }
  return { allowed, ...a };
}
async function decision(c: Case, code: string, input: Command, evidence: object = {}) {
  await MovementApprovalDecision.create(
    {
      requestId: c.id,
      stageId: stage(c, code).get('id'),
      actorUserId: c.actor.user.id,
      requestRevision: c.rev + 1,
      decision: input.action,
      notes: input.comments ?? null,
      evidence: { cycle: c.route.cycle, ...evidence },
    },
    { transaction: c.tx },
  );
}
async function next(c: Case): Promise<MovementState> {
  c.route.stage = [...REQUIRED_APPROVAL_STAGES, ...c.route.additional].find((code) => !c.route.completed.includes(code));
  return c.route.stage ? statuses[c.route.stage] : 'APPROVED';
}
async function checkOrg(c: Case, form: Form) {
  const org = await validateIntake(c.subject, c.actor.employee.companyId, form, c.tx);
  const maker = await identity(c.maker, c.tx);
  if (!maker || maker.employee.companyId !== c.actor.employee.companyId) throw ApiError.forbidden('Initiator no longer eligible');
  await validateInitiator(String(c.detail.get('path')), maker, c.subject, org.current, org.proposed, c.tx);
  return org;
}
async function submit(c: Case, input: Command) {
  const initial = c.state === 'DRAFT',
    path = String(c.detail.get('path'));
  validateSubmission(c.form, path);
  const org = await checkOrg(c, c.form);
  const versionId = initial
    ? await resolveWorkflow(Number(c.request.get('categoryId')), org.employee.companyId, c.tx)
    : Number(c.request.get('workflowVersionId'));
  c.stages = await loadStages(versionId, c.tx);
  if (!initial && org.current.id !== c.detail.get('currentDepartmentId'))
    throw ApiError.conflict('Employee assignment changed since submission');
  await c.detail.update({ currentDepartmentId: org.current.id, proposedDepartmentId: org.proposed.id }, { transaction: c.tx });
  if (!c.route.explicitHR) {
    const on = businessDate(),
      pre = stage(c, 'HR_PRELIMINARY');
    const principal = await principalFor(org.current, 'HR_OFFICER', on, on, c.tx, String(pre.get('scope')));
    await c.detail.update({ hrUserId: principal?.user.id ?? null }, { transaction: c.tx });
  }
  if (!(await eligible(c, 'HR_PRELIMINARY')).length)
    throw ApiError.conflict('An independent HR reviewer must be assigned before submission');
  const reset = initial || c.route.material;
  if (!initial && c.route.resuming) {
    if (c.state === 'CLARIFICATION' && !input.comments) throw ApiError.badRequest('Clarification response required');
    await decision(c, c.route.resuming, input, { material: !!c.route.material });
  }
  if (reset && !initial && hodRole(path) && c.actor.user.id !== c.maker)
    throw ApiError.conflict('Initiating HOD must renew the departmental endorsement');
  if (reset) {
    c.route.completed = [];
    c.route.cycle++;
    c.route.additional = c.stages
      .filter((s) => ['EXECUTIVE', 'FINANCIAL'].includes(String(s.get('stageCode'))) && requiredAdditional(s, c.form))
      .map((s) => String(s.get('stageCode')));
    if (hodRole(path) && c.actor.user.id === c.maker) {
      const evidence = parse<Record<string, string>>(evidenceSchemas[path as 'CURRENT_HOD' | 'RECEIVING_HOD'], input.evidence);
      await decision(c, path, { ...input, action: path === 'CURRENT_HOD' ? 'ENDORSE' : 'ACCEPT' }, evidence);
      c.route.completed.push(path);
    }
  }
  if (initial) {
    await MovementAssignmentSnapshot.bulkCreate(
      [
        { requestId: c.id, kind: 'CURRENT', assignment: org.source },
        { requestId: c.id, kind: 'PROPOSED', assignment: org.target },
      ],
      { transaction: c.tx },
    );
    await c.detail.update(
      { reference: 'ORB/SM/' + businessDate().slice(0, 4) + '/' + String(c.id).padStart(4, '0') },
      { transaction: c.tx },
    );
  }
  await MovementAssignmentSnapshot.create(
    { requestId: c.id, kind: 'V' + (c.rev + 1), assignment: { form: c.form, proposed: org.target, cycle: c.route.cycle } },
    { transaction: c.tx },
  );
  if (initial) {
    await persistMovementTransition(c.id, 'DRAFT', 'SUBMITTED', c.rev, c.actor.user.id, c.tx, {
      versionId,
      effectiveDate: c.form.effectiveDate,
      audit: { action: 'SUBMIT' },
    });
    c.state = 'SUBMITTED';
    c.rev++;
  }
  if (reset) await next(c);
  else c.route.stage = c.route.resuming;
  delete c.route.material;
  delete c.route.resuming;
  delete c.route.correction;
  delete c.route.objection;
  if (!c.route.stage) throw ApiError.conflict('Missing resume stage');
  return statuses[c.route.stage];
}
async function notify(c: Case, to: MovementState, revision: number) {
  const original = c.state;
  c.state = to;
  try {
    if (['APPROVED', 'CANCELLED', 'WITHDRAWN', 'REJECTED'].includes(to)) {
      const subject = await Employee.findByPk(c.subject, { transaction: c.tx });
      const user = subject && (await User.findOne({ where: { email: subject.email, status: 'ACTIVE' }, transaction: c.tx }));
      const recipients = new Set([c.maker, ...(user ? [user.id] : [])]);
      if (to === 'APPROVED')
        for (const code of ['CURRENT_HOD', 'RECEIVING_HOD']) {
          const dep = await departmentFor(c, code),
            on = businessDate();
          const hod = await principalFor(dep, code, on, on, c.tx, 'DEPARTMENT');
          if (hod) recipients.add(hod.user.id);
        }
      for (const userId of recipients) {
        const recipient = await identity(userId, c.tx);
        if (recipient?.employee.companyId === c.detail.get('companyId'))
          NotificationService.notifyAfterCommit(c.tx, 'MOVEMENT_OUTCOME', { recordId: c.id, occurrence: revision, userId });
      }
      return;
    }
    const correction = to === 'CLARIFICATION' || to === 'RETURNED';
    const code = currentActorStage(c);
    const ids = code ? await eligible(c, code) : correction ? [c.maker] : [];
    if (!ids.length) throw ApiError.conflict('No eligible assignee for the next movement action');
    for (const userId of ids)
      NotificationService.notifyAfterCommit(c.tx, correction ? 'MOVEMENT_CORRECTION_REQUIRED' : 'MOVEMENT_REVIEW_REQUIRED', {
        recordId: c.id,
        occurrence: revision,
        userId,
      });
  } finally {
    c.state = original;
  }
}
export async function applyCommand(userId: number, requestId: number, body: unknown) {
  const input = parse(commandSchema, body);
  return transaction(userId, async (actor, tx) => {
    const c = await loadCase(requestId, actor, tx, true);
    const access = await actions(c);
    if (!access.reviewer && !access.maker && !access.owner && !access.assign)
      throw ApiError.forbidden('Movement authority required');
    if (input.revision !== c.rev) throw ApiError.conflict('Stale movement revision');
    if (!access.allowed.includes(input.action)) throw ApiError.forbidden('Action unavailable for this actor and stage');
    if (input.form && input.action !== 'EDIT') throw ApiError.badRequest('Edit the form before submitting a stage decision');
    let to = c.state;
    if (input.action === 'EDIT') {
      const form = parse(formSchema, input.form);
      const org = await checkOrg(c, form);
      if (!isDeepStrictEqual(c.form, form) && c.state !== 'DRAFT') c.route.material = true;
      if (c.route.material && hodRole(String(c.detail.get('path'))) && c.route.correction === 'HR') c.route.correction = 'MAKER';
      c.form = form;
      await c.detail.update({ form, proposedDepartmentId: org.proposed.id }, { transaction: tx });
    } else if (input.action === 'ASSIGN_HR') {
      const hr = input.hrUserId && (await identity(input.hrUserId, tx, 'REVIEW_STAFF_MOVEMENT'));
      if (
        !hr ||
        hr.employee.companyId !== actor.employee.companyId ||
        [c.maker, userId].includes(hr.user.id) ||
        hr.employee.id === c.subject
      )
        throw ApiError.forbidden('Independent eligible HR reviewer required');
      await c.detail.update({ hrUserId: hr.user.id }, { transaction: tx });
      c.route.explicitHR = true;
    } else if (input.action === 'WITHDRAW') to = 'WITHDRAWN';
    else if (input.action === 'SUBMIT' || input.action === 'RESUBMIT') to = await submit(c, input);
    else {
      const code = currentActorStage(c)!;
      const isEndorsement = ['FORWARD', 'ENDORSE', 'CONDITIONAL_RELEASE', 'ACCEPT', 'RECOMMEND'].includes(input.action);
      const evidence = isEndorsement
        ? parse<Record<string, string>>(evidenceSchemas[code as keyof typeof evidenceSchemas], input.evidence)
        : {};
      if (!input.comments && !isEndorsement && input.action !== 'APPROVE')
        throw ApiError.badRequest('A documented reason is required');
      await decision(c, code, input, evidence);
      switch (input.action) {
        case 'CANCEL':
          to = 'CANCELLED';
          break;
        case 'DECLINE':
          to = 'REJECTED';
          break;
        case 'RETURN':
        case 'CLARIFY':
          c.route.resuming = c.route.stage;
          c.route.correction = code === 'HEAD_OF_HR' || c.route.additional.includes(code) ? 'HR' : 'MAKER';
          delete c.route.objection;
          to = input.action === 'RETURN' ? 'RETURNED' : 'CLARIFICATION';
          break;
        case 'OBJECT':
          c.route.objection = 'HR';
          c.route.objectionActors = [userId];
          break;
        case 'ESCALATE':
          if (c.route.objection === 'HR') {
            c.route.objection = 'HEAD';
            c.route.objectionActors = [...(c.route.objectionActors ?? []), userId];
            break;
          }
          stage(c, 'EXECUTIVE');
          if (!c.route.additional.includes('EXECUTIVE'))
            c.route.additional = c.stages
              .map((s) => String(s.get('stageCode')))
              .filter((s) => s === 'EXECUTIVE' || c.route.additional.includes(s));
          c.route.completed.push(code);
          to = await next(c);
          break;
        case 'RESOLVE':
          delete c.route.objection;
          c.route.completed.push('CURRENT_HOD');
          to = await next(c);
          break;
        default:
          c.route.completed.push(code);
          to = await next(c);
      }
      if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(to)) delete c.route.stage;
    }
    await c.detail.update({ routing: c.route }, { transaction: tx });
    const result = await persistMovementTransition(c.id, c.state, to, c.rev, userId, tx, {
      effectiveDate: c.form.effectiveDate,
      audit: {
        action: input.action,
        cycle: c.route.cycle,
        ...(input.action === 'ASSIGN_HR' ? { hrUserId: input.hrUserId } : {}),
      },
    });
    const renewEndorsement =
      input.action === 'EDIT' && c.route.material && c.route.correction === 'MAKER' && c.actor.user.id !== c.maker;
    if ((input.action !== 'EDIT' || renewEndorsement) && !(input.action === 'ASSIGN_HR' && c.state === 'DRAFT'))
      await notify(c, to, result.revision);
    return { id: c.id, reference: c.detail.get('reference'), ...result };
  });
}
export async function viewCase(c: Case, full: boolean) {
  const a = await actions(c);
  if (!a.reviewer && !a.maker && !a.owner && !a.assign) return null;
  const summary = {
    id: c.id,
    reference: c.detail.get('reference'),
    categoryId: c.request.get('categoryId'),
    employeeId: c.subject,
    status: c.state,
    revision: c.rev,
    stage: currentActorStage(c) ?? null,
    permittedActions: a.allowed,
    effectiveDate: c.form.effectiveDate,
  };
  if (!full || (a.assign && !a.maker && !a.owner && !a.reviewer)) return summary;
  const privateReview = a.reviewer;
  const decisions = await MovementApprovalDecision.findAll({
    where: { requestId: c.id },
    attributes: privateReview ? undefined : ['stageId', 'decision', 'requestRevision', 'createdAt'],
    order: [['id', 'ASC']],
    transaction: c.tx,
  });
  const history = privateReview
    ? await MovementAudit.findAll({
        where: { resource: 'sm_requests', recordId: c.id },
        order: [['id', 'ASC']],
        transaction: c.tx,
      })
    : undefined;
  const snapshots = await MovementAssignmentSnapshot.findAll({
    where: { requestId: c.id, kind: { [Op.in]: ['CURRENT', 'PROPOSED'] } },
    transaction: c.tx,
  });
  const correction =
    a.maker && c.route.correction === 'MAKER'
      ? await MovementApprovalDecision.findOne({
          where: { requestId: c.id, decision: { [Op.in]: ['RETURN', 'CLARIFY'] } },
          attributes: ['notes', 'createdAt'],
          order: [['id', 'DESC']],
          transaction: c.tx,
        })
      : undefined;
  const submissions = privateReview
    ? await MovementAssignmentSnapshot.findAll({
        where: { requestId: c.id, kind: { [Op.like]: 'V%' } },
        order: [['id', 'ASC']],
        transaction: c.tx,
      })
    : undefined;
  return {
    ...summary,
    correction,
    submissions,
    workflowVersionId: c.request.get('workflowVersionId'),
    form: c.form,
    history,
    decisions,
    snapshots,
  };
}
export function readRequest(userId: number, id: number) {
  return transaction(userId, async (actor, tx) => {
    const result = await viewCase(await loadCase(id, actor, tx), true);
    if (!result) throw ApiError.notFound('Movement request not found');
    return result;
  });
}
const querySchema = z.strictObject({
  page: z.coerce.number().int().positive().max(100000).default(1),
  rows: z.coerce.number().int().min(1).max(100).default(20),
  view: z.enum(['accessible', 'initiated', 'employee', 'assigned']).default('accessible'),
  status: z.string().max(40).optional(),
  search: z.string().trim().max(80).optional(),
});
export function listRequests(userId: number, query: unknown) {
  const input = parse(querySchema, query);
  return transaction(userId, async (actor, tx) => {
    const result: NonNullable<Awaited<ReturnType<typeof viewCase>>>[] = [];
    let total = 0,
      last = 0;
    for (;;) {
      const batch = await MovementRequestDetail.findAll({
        attributes: ['id'],
        where: { companyId: actor.employee.companyId, id: { [Op.gt]: last } },
        include: [
          {
            model: MovementRequest,
            as: 'request',
            attributes: [],
            required: true,
            where: {
              ...(input.status
                ? { status: input.status }
                : input.view === 'assigned'
                  ? { status: { [Op.in]: [...Object.values(statuses), 'RETURNED', 'CLARIFICATION'] } }
                  : {}),
              ...(input.view === 'initiated'
                ? { initiatedBy: userId }
                : input.view === 'employee'
                  ? { employeeId: actor.employee.id }
                  : {}),
            },
          },
        ],
        order: [['id', 'ASC']],
        limit: 100,
        transaction: tx,
      });
      if (!batch.length) break;
      for (const rec of batch) {
        last = Number(rec.get('id'));
        const c = await loadCase(last, actor, tx);
        const item = await viewCase(c, false);
        if (
          !item ||
          (input.view === 'assigned' &&
            (!currentActorStage(c) ||
              !item.permittedActions.some((a) => !['EDIT', 'SUBMIT', 'WITHDRAW', 'CANCEL', 'ASSIGN_HR'].includes(a)))) ||
          (input.search &&
            ![item.reference, String(item.id)].some((v) =>
              String(v ?? '')
                .toLowerCase()
                .includes(input.search!.toLowerCase()),
            ))
        )
          continue;
        if (total >= (input.page - 1) * input.rows && result.length < input.rows) result.push(item);
        total++;
      }
    }
    return { rows: result, total, page: input.page };
  });
}
