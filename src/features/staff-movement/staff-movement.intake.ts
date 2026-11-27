import { Model, Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { Employee } from '../employee/employee.model';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';
import HRDocument from '../hr-document/hr-document.model';
import {
  MovementBranch,
  MovementCategory,
  MovementCostCentre,
  MovementGrade,
  MovementLegalEntity,
  MovementLocation,
  MovementPosition,
  MovementWorkflow,
  MovementWorkflowVersion,
} from './staff-movement.models';

export const id = z.number().int().positive();
export const note = z.string().trim().min(1).max(4000);
export const paths = z.enum(['RECEIVING_HOD', 'CURRENT_HOD', 'HR_PLANNING', 'EMPLOYEE_VOLUNTARY', 'EXECUTIVE_DIRECTED']);
export const formSchema = z.strictObject({
  departmentId: id,
  effectiveDate: z.iso.date(),
  positionId: id.optional(),
  designationId: id.optional(),
  managerId: id.optional(),
  branchId: id.optional(),
  locationId: id.optional(),
  gradeId: id.optional(),
  legalEntityId: id.optional(),
  costCentreId: id.optional(),
  duration: z.enum(['PERMANENT', 'TEMPORARY']).optional(),
  endDate: z.iso.date().optional(),
  reason: note.optional(),
  justification: note.optional(),
  replacementRequired: z.boolean().optional(),
  compensationImplication: z.boolean().optional(),
  gradeChange: z.boolean().optional(),
  legalEntityChange: z.boolean().optional(),
  policyException: z.boolean().optional(),
  documentIds: z.array(z.uuid()).max(20).optional(),
  directiveReference: note.optional(),
});
export type Form = z.infer<typeof formSchema>;
export const createSchema = z.strictObject({ employeeId: id, categoryId: id, path: paths, form: formSchema });
export const evidenceSchemas = {
  HR_PRELIMINARY: z.strictObject({
    eligibility: note,
    headcount: note,
    position: note,
    competency: note,
    pendingMatters: note,
    compensation: note,
    policy: note,
    manualVerification: note,
    recommendation: note,
  }),
  CURRENT_HOD: z.strictObject({
    earliestRelease: z.iso.date(),
    handover: note,
    outstandingResponsibilities: note,
    replacement: note,
    operationalRisks: note,
    conditions: note,
  }),
  RECEIVING_HOD: z.strictObject({
    responsibilities: note,
    jobDescription: note,
    reporting: note,
    suitability: note,
    resumption: z.iso.date(),
    costCentre: note,
    kpis: note,
    training: note,
    conditions: note,
  }),
  HR_RECOMMENDATION: z.strictObject({
    recommendation: note,
    conditions: note,
    policyExceptions: note,
    compensation: note,
    handoverDeadline: z.iso.date(),
  }),
};
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const valid = schema.safeParse(value);
  if (!valid.success)
    throw ApiError.badRequest(
      'Invalid movement input: ' + valid.error.issues.map((issue) => issue.path.join('.') || 'body').join(', '),
    );
  return valid.data;
}
export const businessDate = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );
export async function resolveWorkflow(categoryId: number, companyId: number, transaction: Transaction) {
  const options = { transaction, lock: transaction.LOCK.SHARE };
  const category = await MovementCategory.findByPk(categoryId, options);
  if (!category?.get('active')) throw ApiError.badRequest('Active movement category required');
  const workflows = await MovementWorkflow.findAll({
    where: { categoryId, active: true, [Op.or]: [{ companyId }, { companyId: null }] },
    ...options,
  });
  const owned = workflows.filter((w) => w.get('companyId') === companyId);
  const applicable = owned.length ? owned : workflows;
  const versions = await MovementWorkflowVersion.findAll({
    where: { workflowId: { [Op.in]: applicable.map((w) => w.get('id')) }, status: 'ACTIVE' },
    ...options,
  });
  if (versions.length !== 1) throw ApiError.conflict('Exactly one published movement workflow is required');
  return Number(versions[0].get('id'));
}
export async function validateIntake(employeeId: number, companyId: number, form: Form, transaction: Transaction) {
  const options = { transaction, lock: transaction.LOCK.SHARE };
  const employee = await Employee.findByPk(employeeId, options);
  if (!employee || employee.companyId !== companyId || !['ACTIVE', 'ON_LEAVE'].includes(employee.status))
    throw ApiError.forbidden('Eligible employee in company required');
  const current = await Department.findOne({ where: { id: employee.departmentId, companyId }, ...options });
  const proposed = await Department.findOne({ where: { id: form.departmentId, companyId }, ...options });
  if (!current || !proposed) throw ApiError.badRequest('Invalid departmental scope');
  if (
    (form.duration === 'TEMPORARY' && form.endDate && form.endDate < form.effectiveDate) ||
    (form.duration === 'PERMANENT' && form.endDate)
  )
    throw ApiError.badRequest('Invalid duration or end date');
  const target: Record<string, unknown> = { departmentId: proposed.id, departmentName: proposed.name, companyId };
  for (const [field, model] of [
    ['branchId', MovementBranch],
    ['locationId', MovementLocation],
    ['gradeId', MovementGrade],
    ['legalEntityId', MovementLegalEntity],
    ['costCentreId', MovementCostCentre],
  ] as const) {
    const key = form[field];
    if (!key) continue;
    const row = await model.findOne({ where: { id: key, companyId, active: true }, ...options });
    if (!row) throw ApiError.badRequest('Invalid ' + field);
    target[field] = key;
    target[field.replace('Id', 'Name')] = row.get('name');
  }
  if (form.positionId) {
    const row = await MovementPosition.findOne({
      where: { id: form.positionId, departmentId: proposed.id, active: true },
      ...options,
    });
    if (!row || (form.designationId && row.get('jobRoleId') !== form.designationId))
      throw ApiError.badRequest('Invalid proposed position');
    Object.assign(target, { positionId: form.positionId, positionName: row.get('name'), designationId: row.get('jobRoleId') });
  }
  if (form.designationId || target.designationId) {
    const role = await JobRole.findOne({
      where: { id: Number(form.designationId || target.designationId), departmentId: proposed.id },
      ...options,
    });
    if (!role) throw ApiError.badRequest('Invalid proposed designation');
    Object.assign(target, { designationId: role.id, designationName: role.title });
  }
  if (form.managerId) {
    const manager = await Employee.findByPk(form.managerId, options);
    if (
      !manager ||
      manager.id === employee.id ||
      manager.companyId !== companyId ||
      !['ACTIVE', 'ON_LEAVE'].includes(manager.status)
    )
      throw ApiError.badRequest('Invalid proposed manager');
    target.managerId = manager.id;
  }
  for (const documentId of new Set(form.documentIds)) {
    if (!(await HRDocument.findOne({ where: { id: documentId, access_level: 'public' }, attributes: ['id'], ...options })))
      throw ApiError.badRequest('Supporting document is unavailable');
  }
  return {
    employee,
    current,
    proposed,
    target,
    source: {
      employeeId: employee.id,
      staffId: employee.staffId,
      employeeName: [employee.firstName, employee.lastName].join(' '),
      companyId,
      departmentId: current.id,
      departmentName: current.name,
      designationId: employee.jobRoleId,
      managerId: employee.supervisorId ?? null,
      status: employee.status,
      gradeId: null,
      positionId: null,
      branchId: null,
      locationId: null,
      legalEntityId: null,
      costCentreId: null,
    },
  };
}
export function validateSubmission(form: Form, path: string) {
  if (
    !form.duration ||
    !form.reason ||
    !form.justification ||
    form.compensationImplication === undefined ||
    form.replacementRequired === undefined ||
    !(form.positionId || form.designationId) ||
    (form.duration === 'TEMPORARY' && !form.endDate) ||
    (path === 'EXECUTIVE_DIRECTED' && !form.directiveReference) ||
    form.effectiveDate < businessDate()
  )
    throw ApiError.badRequest('Incomplete submission or backdated effective date');
}
export function requiredAdditional(stage: Model, form: Form): boolean {
  const settings = stage.get('settings') as Record<string, unknown>;
  const flags = ['gradeChange', 'compensationImplication', 'legalEntityChange', 'policyException'] as const;
  if (Object.keys(settings).some((k) => k !== 'whenAny')) throw ApiError.badRequest('Unsupported additional-stage settings');
  const list = settings.whenAny;
  if (list === undefined && stage.get('mandatory')) return true;
  if (!Array.isArray(list) || !list.length || list.some((k) => !flags.includes(k)))
    throw ApiError.badRequest('Additional stage requires published conditions');
  if (list.some((k) => form[k as (typeof flags)[number]] === undefined))
    throw ApiError.badRequest('Missing movement facts for conditional approval');
  return Boolean(stage.get('mandatory')) || list.some((k) => form[k as (typeof flags)[number]] === true);
}
