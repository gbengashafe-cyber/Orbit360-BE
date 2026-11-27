import { Model, Op, Transaction } from 'sequelize';
import { ApiError } from '../../utils/api-error';
import { Department } from '../department/department.model';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';
import { JobRolePermissions } from '../permissions/permission.model';
import { MovementApproverAssignment, MovementDelegation, MovementHodAssignment } from './staff-movement.models';

export const approverRoles = ['HR_OFFICER', 'HEAD_OF_HR', 'EXECUTIVE', 'FINANCIAL'] as const;
export const hodRole = (role: string) => ['CURRENT_HOD', 'RECEIVING_HOD'].includes(role);
export function permissionFor(role: string) {
  if (hodRole(role) || role === 'HR_OFFICER') return 'REVIEW_STAFF_MOVEMENT';
  if (approverRoles.some((value) => value === role)) return 'APPROVE_STAFF_MOVEMENT';
  throw ApiError.badRequest('Unknown movement authority');
}
export const overlap = (start: string, end?: string | null) => ({
  startsOn: { [Op.lte]: end ?? '9999-12-31' },
  [Op.or]: [{ endsOn: null }, { endsOn: { [Op.gte]: start } }],
});
export async function identity(userId: number, transaction: Transaction, permission?: string) {
  const options = { transaction, lock: transaction.LOCK.SHARE };
  const user = await User.findByPk(userId, options);
  if (user?.status !== 'ACTIVE') return null;
  const mapped = await Employee.findAll({ where: { email: user.email }, limit: 2, ...options });
  const employee = mapped[0];
  if (mapped.length !== 1 || !['ACTIVE', 'ON_LEAVE'].includes(employee.status) || !employee.companyId) return null;
  if (permission && !(await JobRolePermissions.findOne({ where: { jobRoleId: user.jobRoleId, permission }, ...options })))
    return null;
  return { user, employee };
}
export type MovementIdentity = NonNullable<Awaited<ReturnType<typeof identity>>>;

export async function principalFor(
  department: Department,
  role: string,
  start: string,
  end: string,
  transaction: Transaction,
  stageScope?: string,
) {
  const dates = { active: true, ...overlap(start, end) };
  const options = { transaction, lock: transaction.LOCK.SHARE };
  let assignment: Model;
  let userId: number;
  if (hodRole(role)) {
    if (stageScope !== undefined && stageScope !== 'DEPARTMENT') return null;
    const rows = await MovementHodAssignment.findAll({ where: { departmentId: department.id, ...dates }, ...options });
    if (rows.length !== 1) return null;
    assignment = rows[0];
    const employee = await Employee.findByPk(Number(assignment.get('employeeId')), options);
    if (employee?.departmentId !== department.id) return null;
    const users = await User.findAll({ where: { email: employee.email }, limit: 2, ...options });
    if (users.length !== 1) return null;
    userId = users[0].id;
  } else {
    const rows = await MovementApproverAssignment.findAll({
      where: {
        companyId: department.companyId,
        authority: role,
        ...dates,
        [Op.and]: [{ [Op.or]: [{ departmentId: null }, { departmentId: department.id }] }],
      },
      ...options,
    });
    if (rows.length !== 1) return null;
    assignment = rows[0];
    if (stageScope && stageScope !== (assignment.get('departmentId') == null ? 'ORGANIZATION' : 'DEPARTMENT')) return null;
    userId = Number(assignment.get('userId'));
  }
  if (String(assignment.get('startsOn')) > start || (assignment.get('endsOn') && String(assignment.get('endsOn')) < end))
    return null;
  const account = await identity(userId, transaction, permissionFor(role));
  return account?.employee.companyId === department.companyId ? { ...account, assignment } : null;
}

export async function requireStageActor(
  input: {
    actorId: number;
    makerId: number;
    subjectId: number;
    department: Department;
    role: string;
    stageScope: string;
  },
  transaction: Transaction,
) {
  const { actorId, makerId, subjectId, department, role, stageScope } = input;
  const on = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const principal = await principalFor(department, role, on, on, transaction, stageScope);
  const denied = () => ApiError.forbidden('No eligible independent movement authority');
  if (!principal || principal.user.id === makerId || principal.employee.id === subjectId) throw denied();
  if (principal.user.id === actorId) return;
  const key = hodRole(role) ? 'hodAssignmentId' : 'approverAssignmentId';
  const rows = await MovementDelegation.findAll({
    where: {
      principalUserId: principal.user.id,
      departmentId: department.id,
      scope: role,
      [key]: principal.assignment.get('id'),
      active: true,
      ...overlap(on, on),
    },
    transaction,
    lock: transaction.LOCK.SHARE,
  });
  if (rows.length !== 1 || rows[0].get(key) !== principal.assignment.get('id') || rows[0].get('delegateUserId') !== actorId)
    throw denied();
  const delegate = await identity(actorId, transaction, permissionFor(role));
  if (
    !delegate ||
    delegate.employee.companyId !== department.companyId ||
    delegate.employee.id === subjectId ||
    actorId === makerId
  )
    throw denied();
}
