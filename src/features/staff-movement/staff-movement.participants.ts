import { Model, Transaction } from 'sequelize';
import { ApiError } from '../../utils/api-error';
import { Department } from '../department/department.model';
import { MovementApprovalStage, MovementDelegation, MovementRequest, MovementRequestDetail } from './staff-movement.models';
import { identity, hodRole, overlap, principalFor, requireStageActor, MovementIdentity } from './staff-movement.authority';
import { businessDate, Form } from './staff-movement.intake';
import { MovementState, stageAuthority, validateApprovalStages } from './staff-movement.foundation';

export type Routing = {
  stage?: string;
  completed: string[];
  additional: string[];
  resuming?: string;
  correction?: 'HR' | 'MAKER';
  objection?: 'HR' | 'HEAD';
  objectionActors?: number[];
  explicitHR?: boolean;
  material?: boolean;
  cycle: number;
};
export async function loadCase(id: number, actor: MovementIdentity, tx: Transaction, write = false) {
  const options = { transaction: tx, lock: write ? tx.LOCK.UPDATE : tx.LOCK.SHARE };
  const request = await MovementRequest.findByPk(id, options);
  const detail = await MovementRequestDetail.findOne({ where: { id, companyId: actor.employee.companyId }, ...options });
  if (!request || !detail) throw ApiError.notFound('Movement request not found');
  const stages = await loadStages(Number(request.get('workflowVersionId')), tx);
  return {
    id,
    request,
    detail,
    actor,
    tx,
    stages,
    form: detail.get('form') as Form,
    route: structuredClone(detail.get('routing') as Routing),
    state: request.get('status') as MovementState,
    maker: Number(request.get('initiatedBy')),
    subject: Number(request.get('employeeId')),
    rev: Number(request.get('revision')),
  };
}
export type Case = Awaited<ReturnType<typeof loadCase>>;
export async function loadStages(versionId: number, tx: Transaction) {
  const stages = await MovementApprovalStage.findAll({ where: { versionId }, order: [['stageOrder', 'ASC']], transaction: tx });
  if (
    !validateApprovalStages(stages.map((s) => String(s.get('stageCode')))) ||
    stages.some((s) => stageAuthority[String(s.get('stageCode'))] !== s.get('authority'))
  )
    throw ApiError.conflict('Invalid frozen approval matrix');
  return stages;
}
export function stage(c: Case, code: string): Model {
  const row = c.stages.find((s) => s.get('stageCode') === code);
  if (!row) throw ApiError.conflict('Missing frozen stage ' + code);
  return row;
}
export async function departmentFor(c: Case, code: string) {
  const dep = await Department.findOne({
    where: {
      id: Number(c.detail.get(code === 'RECEIVING_HOD' ? 'proposedDepartmentId' : 'currentDepartmentId')),
      companyId: Number(c.detail.get('companyId')),
    },
    transaction: c.tx,
    lock: c.tx.LOCK.SHARE,
  });
  if (!dep) throw ApiError.conflict('Invalid movement department');
  return dep;
}
export async function eligible(c: Case, code: string): Promise<number[]> {
  const row = stage(c, code),
    role = String(row.get('authority')),
    dept = await departmentFor(c, code),
    on = businessDate();
  const hr = role === 'HR_OFFICER',
    assigned = Number(c.detail.get('hrUserId'));
  const account = hr && assigned ? await identity(assigned, c.tx, 'REVIEW_STAFF_MOVEMENT') : null;
  if (
    hr &&
    (!account ||
      account.employee.companyId !== dept.companyId ||
      account.user.id === c.maker ||
      account.employee.id === c.subject)
  )
    return [];
  if (hr && c.route.explicitHR)
    return row.get('scope') === 'DEPARTMENT' && account?.employee.departmentId !== dept.id ? [] : [assigned];
  const principal = await principalFor(dept, role, on, on, c.tx, String(row.get('scope')));
  if (
    !principal ||
    (hr && principal.user.id !== assigned) ||
    principal.user.id === c.maker ||
    principal.employee.id === c.subject
  )
    return [];
  if (c.route.objection === 'HEAD' && c.route.objectionActors?.includes(principal.user.id)) return [];
  const binding = hodRole(role) ? 'hodAssignmentId' : 'approverAssignmentId';
  const rows = await MovementDelegation.findAll({
    where: {
      [binding]: principal.assignment.get('id'),
      scope: role,
      departmentId: dept.id,
      principalUserId: principal.user.id,
      active: true,
      ...overlap(on, on),
    },
    transaction: c.tx,
    lock: c.tx.LOCK.SHARE,
  });
  const ids = [principal.user.id];
  if (rows.length === 1) {
    const delegate = Number(rows[0].get('delegateUserId'));
    try {
      await requireStageActor(
        {
          actorId: delegate,
          makerId: c.maker,
          subjectId: c.subject,
          department: dept,
          role,
          stageScope: String(row.get('scope')),
        },
        c.tx,
      );
      ids.push(delegate);
    } catch (err) {
      if (!(err instanceof ApiError && err.code === 403)) throw err;
    }
  }
  return [...new Set(ids)].filter((id) => c.route.objection !== 'HEAD' || !c.route.objectionActors?.includes(id));
}
export async function validateInitiator(
  path: string,
  actor: MovementIdentity,
  subject: number,
  current: Department,
  proposed: Department,
  tx: Transaction,
) {
  if (path === 'EMPLOYEE_VOLUNTARY') {
    if (actor.employee.id !== subject) throw ApiError.forbidden('Voluntary requests are employee-owned');
    return;
  }
  const role = hodRole(path) ? path : 'HR_OFFICER';
  if (role !== 'HR_OFFICER' && current.id === proposed.id && path === 'RECEIVING_HOD')
    throw ApiError.badRequest('Receiving HOD requires another department');
  const dep = path === 'RECEIVING_HOD' ? proposed : current,
    on = businessDate();
  const principal = await principalFor(dep, role, on, on, tx);
  if (!principal) throw ApiError.forbidden('Scoped initiating authority required');
  await requireStageActor(
    {
      actorId: actor.user.id,
      makerId: -1,
      subjectId: subject,
      department: dep,
      role,
      stageScope: hodRole(role) || principal.assignment.get('departmentId') != null ? 'DEPARTMENT' : 'ORGANIZATION',
    },
    tx,
  );
}
export function currentActorStage(c: Case) {
  if (c.route.objection) return c.route.objection === 'HR' ? 'HR_PRELIMINARY' : 'HEAD_OF_HR';
  if (c.state === 'RETURNED' || c.state === 'CLARIFICATION') return c.route.correction === 'HR' ? 'HR_RECOMMENDATION' : undefined;
  if (c.state === 'APPROVED') return 'HEAD_OF_HR';
  return c.route.stage;
}
export async function roleAccess(c: Case) {
  const code = currentActorStage(c);
  const reviewer = !!code && (await eligible(c, code)).includes(c.actor.user.id);
  const maker = c.maker === c.actor.user.id,
    owner = c.subject === c.actor.employee.id;
  const assign =
    ['DRAFT', 'PENDING_HR_VALIDATION', 'PENDING_FINAL_HR_REVIEW', 'RETURNED', 'CLARIFICATION'].includes(c.state) &&
    !owner &&
    !maker &&
    !!(await identity(c.actor.user.id, c.tx, 'MANAGE_STAFF_MOVEMENT_CONFIGURATION'));
  return { reviewer, maker, owner, assign };
}
