import { Model, ModelStatic, Op, Transaction } from 'sequelize';
import { db } from '../../db';
import {
  identity,
  MovementIdentity,
  approverRoles,
  hodRole,
  overlap,
  permissionFor,
  principalFor,
} from './staff-movement.authority';
import { ApiError } from '../../utils/api-error';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';
import { stageAuthority, validateApprovalStages } from './staff-movement.foundation';
import {
  changeVersionStatus,
  MovementAudit,
  MovementApproverAssignment,
  MovementApprovalStage,
  MovementBranch,
  MovementCategory,
  MovementCostCentre,
  MovementDelegation,
  MovementGrade,
  MovementHeadcount,
  MovementHodAssignment,
  MovementLegalEntity,
  MovementLocation,
  MovementPosition,
  MovementWorkflow,
  MovementWorkflowVersion,
} from './staff-movement.models';
import { Company } from '../company/company.model';

export type Stage = {
  stageCode: string;
  authority: string;
  scope: string;
  mandatory: boolean;
  settings: Record<string, unknown>;
};
export const configurationModels: Record<string, ModelStatic<Model>> = {
  categories: MovementCategory,
  workflows: MovementWorkflow,
  branches: MovementBranch,
  locations: MovementLocation,
  grades: MovementGrade,
  costCentres: MovementCostCentre,
  legalEntities: MovementLegalEntity,
  positions: MovementPosition,
  headcounts: MovementHeadcount,
  approverAssignments: MovementApproverAssignment,
  hodAssignments: MovementHodAssignment,
  delegations: MovementDelegation,
};
const validStages = (stages: Stage[]) =>
  validateApprovalStages(stages.map((stage) => stage.stageCode)) &&
  stages.every(
    (stage) =>
      stage.authority === stageAuthority[stage.stageCode] &&
      ['ORGANIZATION', 'DEPARTMENT'].includes(stage.scope) &&
      (!hodRole(stage.authority) || stage.scope === 'DEPARTMENT') &&
      (['EXECUTIVE', 'FINANCIAL'].includes(stage.stageCode) || stage.mandatory === true),
  );
const checkDates = (start: string, end?: string | null) => {
  const valid = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(start) || (end && (!valid(end) || end < start))) throw ApiError.badRequest('Invalid assignment dates');
};
export class StaffMovementService {
  private constructor(
    private actor: MovementIdentity,
    private transaction: Transaction,
  ) {}

  static async configure<T>(actorId: number, operation: (service: StaffMovementService) => Promise<T>) {
    return db.transaction(async (transaction) => {
      const actor = await identity(actorId, transaction, 'MANAGE_STAFF_MOVEMENT_CONFIGURATION');
      if (!actor) throw ApiError.forbidden('Movement configuration permission and eligible employee required');
      return operation(new StaffMovementService(actor, transaction));
    });
  }
  private get options() {
    return { transaction: this.transaction, lock: this.transaction.LOCK.UPDATE };
  }
  private get companyId() {
    return this.actor.employee.companyId;
  }
  private async department(id: number) {
    const department = await Department.findOne({ where: { id, companyId: this.companyId }, ...this.options });
    if (!department) throw ApiError.forbidden('Department outside managed scope');
    return department;
  }
  private async filter(resource: string) {
    if (resource === 'categories') return {};
    if (['positions', 'headcounts', 'hodAssignments', 'delegations'].includes(resource)) {
      const departments = await Department.findAll({
        where: { companyId: this.companyId },
        attributes: ['id'],
        transaction: this.transaction,
      });
      return { departmentId: { [Op.in]: departments.map((d) => d.id) } };
    }
    if (resource === 'workflows' && this.actor.user.role === 'admin')
      return { [Op.or]: [{ companyId: this.companyId }, { companyId: null }] };
    return { companyId: this.companyId };
  }
  async list(resource: string) {
    return configurationModels[resource].findAll({
      where: await this.filter(resource),
      order: [['id', 'ASC']],
      transaction: this.transaction,
    });
  }
  async get(resource: string, id: number) {
    const record = await configurationModels[resource].findOne({
      where: { id, ...(await this.filter(resource)) },
      ...this.options,
    });
    if (!record) throw ApiError.notFound('Configuration record not found');
    return record;
  }
  private requireGlobalManager() {
    if (this.actor.user.role !== 'admin') throw ApiError.forbidden('Global configuration requires a platform administrator');
  }
  private async workflow(id: number) {
    const workflow = await this.get('workflows', id);
    if (workflow.get('companyId') == null) this.requireGlobalManager();
    return workflow;
  }
  private async audit(row: Model, action: string, changes?: object) {
    await MovementAudit.create(
      {
        resource: row.constructor.name,
        recordId: row.get('id'),
        action,
        changes:
          changes ??
          Object.fromEntries(
            Object.entries(row.get({ plain: true })).filter(([key]) => !['settings', 'createdAt', 'updatedAt'].includes(key)),
          ),
        actorUserId: this.actor.user.id,
      },
      { transaction: this.transaction },
    );
    return row;
  }
  private async change(row: Model, values: Record<string, unknown>, action = 'UPDATE') {
    if (!Object.keys(values).length) throw ApiError.badRequest('At least one field is required');
    const changes = Object.fromEntries(
      Object.keys(values).map((key) => [
        key,
        key === 'settings' ? { changed: true } : { before: row.get(key), after: values[key] },
      ]),
    );
    await row.update(values, { transaction: this.transaction });
    return this.audit(row, action, changes);
  }
  async update(resource: string, id: number, values: { name?: string; active?: boolean }) {
    if (!['workflows', 'branches', 'locations', 'grades', 'costCentres', 'legalEntities', 'positions'].includes(resource))
      throw ApiError.badRequest('Updates are not supported for this resource');
    if (values.name !== undefined && !values.name.trim()) throw ApiError.badRequest('Name is required');
    const record = await this.get(resource, id);
    if (resource === 'workflows' && record.get('companyId') == null) this.requireGlobalManager();
    return this.change(record, {
      ...(values.name !== undefined ? { name: values.name.trim() } : {}),
      ...(values.active !== undefined ? { active: values.active } : {}),
    });
  }

  async listVersions(workflowId: number) {
    await this.get('workflows', workflowId);
    return MovementWorkflowVersion.findAll({
      transaction: this.transaction,
      where: { workflowId },
      include: [{ model: MovementApprovalStage, as: 'stages' }],
      order: [
        ['version', 'DESC'],
        [{ model: MovementApprovalStage, as: 'stages' }, 'stageOrder', 'ASC'],
      ],
    });
  }

  async getVersion(workflowId: number, versionId: number) {
    await this.get('workflows', workflowId);
    const version = await MovementWorkflowVersion.findOne({
      transaction: this.transaction,
      where: { id: versionId, workflowId },
      include: [{ model: MovementApprovalStage, as: 'stages' }],
    });
    if (!version) throw ApiError.notFound('Workflow version not found');
    return version;
  }

  async retireVersion(workflowId: number, versionId: number) {
    const transaction = this.transaction;
    const workflow = await this.workflow(workflowId);
    if (!workflow) throw ApiError.notFound('Workflow not found');
    const version = await MovementWorkflowVersion.findOne({
      where: { id: versionId, workflowId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!version || version.get('status') !== 'ACTIVE') throw ApiError.badRequest('Only an active version can be retired');
    return this.audit(await changeVersionStatus(version, 'RETIRED', transaction), 'RETIRE');
  }

  async deactivateHod(id: number) {
    const assignment = await this.get('hodAssignments', id);
    return this.change(assignment, { active: false }, 'REVOKE');
  }

  async createWorkflow(categoryId: number, name: string) {
    const category = await MovementCategory.findByPk(categoryId, this.options);
    if (!category || !name.trim()) throw ApiError.badRequest('Existing category and name required');
    return this.audit(
      await MovementWorkflow.create({ companyId: this.companyId, categoryId, name: name.trim(), active: true }, this.options),
      'CREATE',
    );
  }

  async createMasterData(
    kind: 'branch' | 'location' | 'grade' | 'costCentre' | 'legalEntity',
    input: { companyId: number; code: string; name: string },
  ) {
    const models = {
      branch: MovementBranch,
      location: MovementLocation,
      grade: MovementGrade,
      costCentre: MovementCostCentre,
      legalEntity: MovementLegalEntity,
    };
    const model = models[kind];
    if (!model || !input.code.trim() || !input.name.trim() || input.companyId !== this.companyId)
      throw ApiError.badRequest('Valid company, code and name required');
    return this.audit(
      await model.create({ ...input, code: input.code.trim(), name: input.name.trim(), active: true }, this.options),
      'CREATE',
    );
  }

  async setHeadcount(input: {
    departmentId: number;
    positionId: number;
    approvedCount: number;
    effectiveFrom: string;
    effectiveTo?: string | null;
  }) {
    await this.department(input.departmentId);
    checkDates(input.effectiveFrom, input.effectiveTo);
    if (!Number.isSafeInteger(input.approvedCount) || input.approvedCount < 0)
      throw ApiError.badRequest('Approved count must be nonnegative');
    const transaction = this.transaction;
    const position = await MovementPosition.findOne({
      where: { id: input.positionId, departmentId: input.departmentId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!position) throw ApiError.badRequest('Position must belong to department');
    const overlapping = await MovementHeadcount.findOne({
      where: {
        positionId: input.positionId,
        effectiveFrom: { [Op.lte]: input.effectiveTo ?? '9999-12-31' },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: input.effectiveFrom } }],
      },
      transaction,
    });
    if (overlapping) throw ApiError.badRequest('Overlapping headcount period');
    return this.audit(await MovementHeadcount.create(input, { transaction }), 'CREATE');
  }

  async updateHeadcount(id: number, values: { approvedCount?: number; effectiveTo?: string | null }) {
    const row = await this.get('headcounts', id);
    const positionId = Number(row.get('positionId'));
    await MovementPosition.findByPk(positionId, this.options);
    const start = String(row.get('effectiveFrom'));
    const end = values.effectiveTo === undefined ? (row.get('effectiveTo') as string | null) : values.effectiveTo;
    checkDates(start, end);
    const conflict = await MovementHeadcount.findOne({
      where: {
        positionId,
        id: { [Op.ne]: id },
        effectiveFrom: { [Op.lte]: end ?? '9999-12-31' },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: start } }],
      },
      ...this.options,
    });
    if (conflict) throw ApiError.badRequest('Overlapping headcount period');
    return this.change(row, values);
  }

  async revokeDelegation(id: number) {
    const delegation = await this.get('delegations', id);
    if (!delegation) throw ApiError.notFound('Delegation not found');
    return this.change(delegation, { active: false }, 'REVOKE');
  }

  async updateCategory(id: number, values: { name?: string; active?: boolean; settings?: Record<string, unknown> }) {
    this.requireGlobalManager();
    const category = await this.get('categories', id);
    if (!category) throw ApiError.notFound('Movement category not found');
    if (values.name !== undefined && !values.name.trim()) throw ApiError.badRequest('Name is required');
    return this.change(category, values);
  }

  async createVersion(workflowId: number, stages: Stage[], settings: Record<string, unknown>) {
    if (!validStages(stages)) {
      throw ApiError.badRequest('Invalid movement approval stages');
    }
    const transaction = this.transaction;
    await this.workflow(workflowId);
    const latest = await MovementWorkflowVersion.max('version', { where: { workflowId }, transaction });
    const version = await MovementWorkflowVersion.create(
      { workflowId, version: Number(latest || 0) + 1, status: 'DRAFT', settings },
      { transaction },
    );
    await MovementApprovalStage.bulkCreate(
      stages.map((stage, index) => ({ ...stage, versionId: version.get('id'), stageOrder: index + 1 })),
      { transaction },
    );
    return this.audit(version, 'CREATE_VERSION', { stageCodes: stages.map((stage) => stage.stageCode) });
  }

  async activateVersion(workflowId: number, versionId: number) {
    const transaction = this.transaction;
    await this.workflow(workflowId);
    const version = await MovementWorkflowVersion.findOne({
      where: { id: versionId, workflowId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!version || version.get('status') !== 'DRAFT') throw ApiError.badRequest('Only a draft version may be activated');
    const stages = await MovementApprovalStage.findAll({ where: { versionId }, order: [['stageOrder', 'ASC']], transaction });
    if (!validStages(stages.map((stage) => stage.get({ plain: true }) as Stage)))
      throw ApiError.badRequest('Invalid movement approval stages');
    const active = await MovementWorkflowVersion.findAll({ where: { workflowId, status: 'ACTIVE' }, ...this.options });
    for (const prior of active) await this.audit(await changeVersionStatus(prior, 'RETIRED', transaction), 'RETIRE');
    return this.audit(await changeVersionStatus(version, 'ACTIVE', transaction), 'PUBLISH');
  }

  async createPosition(input: { departmentId: number; jobRoleId: number; code: string; name: string }) {
    await this.department(input.departmentId);
    const role = await JobRole.findByPk(input.jobRoleId, this.options);
    if (!role || role.departmentId !== input.departmentId || !input.code.trim() || !input.name.trim())
      throw ApiError.badRequest('Position must match an existing departmental designation');
    return this.audit(await MovementPosition.create(input, this.options), 'CREATE');
  }

  async validateHeadcount(positionId: number, departmentId: number, on: string) {
    await this.department(departmentId);
    checkDates(on);
    const position = await MovementPosition.findOne({
      transaction: this.transaction,
      where: { id: positionId, departmentId, active: true },
    });
    const rows = await MovementHeadcount.findAll({
      transaction: this.transaction,
      where: {
        positionId,
        departmentId,
        effectiveFrom: { [Op.lte]: on },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: on } }],
      },
    });
    if (!position || rows.length !== 1) return { validation: 'MANUAL_REQUIRED' as const };
    // Existing employee records are not linked to approved positions. Do not assert availability.
    return { validation: 'MANUAL_REQUIRED' as const, approvedCount: Number(rows[0].get('approvedCount')) };
  }

  async assignHod(input: {
    departmentId: number;
    employeeId: number;
    startsOn: string;
    endsOn?: string | null;
    acting: boolean;
  }) {
    checkDates(input.startsOn, input.endsOn);
    const transaction = this.transaction;
    const dept = await this.department(input.departmentId);
    const employee = await Employee.findByPk(input.employeeId, { transaction });
    if (!dept || !employee || !['ACTIVE', 'ON_LEAVE'].includes(employee.status) || employee.departmentId !== input.departmentId)
      throw ApiError.badRequest('Eligible employee in department required');
    const users = await User.findAll({ where: { email: employee.email }, limit: 2, ...this.options });
    const account = users.length === 1 && (await identity(users[0].id, transaction, permissionFor('CURRENT_HOD')));
    if (!account || account.employee.companyId !== this.companyId || users[0].id === this.actor.user.id)
      throw ApiError.forbidden('Independent eligible HOD required');
    const conflict = await MovementHodAssignment.findOne({
      where: { departmentId: input.departmentId, active: true, ...overlap(input.startsOn, input.endsOn) },
      ...this.options,
    });
    if (conflict) throw ApiError.badRequest('Overlapping HOD assignment');
    return this.audit(await MovementHodAssignment.create(input, { transaction }), 'ASSIGN');
  }

  async assignApprover(input: {
    departmentId?: number | null;
    userId: number;
    authority: string;
    startsOn: string;
    endsOn?: string | null;
  }) {
    checkDates(input.startsOn, input.endsOn);
    if (!approverRoles.some((role) => role === input.authority)) throw ApiError.badRequest('Invalid approver authority');
    await Company.findByPk(this.companyId, this.options);
    if (input.departmentId) await this.department(input.departmentId);
    const account = await identity(input.userId, this.transaction, permissionFor(input.authority));
    if (!account || account.employee.companyId !== this.companyId || input.userId === this.actor.user.id)
      throw ApiError.forbidden('Independent eligible approver required');
    const conflict = await MovementApproverAssignment.findOne({
      where: {
        companyId: this.companyId,
        authority: input.authority,
        active: true,
        ...overlap(input.startsOn, input.endsOn),
        ...(input.departmentId
          ? { [Op.and]: [{ [Op.or]: [{ departmentId: null }, { departmentId: input.departmentId }] }] }
          : {}),
      },
      ...this.options,
    });
    if (conflict) throw ApiError.badRequest('Overlapping approver assignment');
    return this.audit(await MovementApproverAssignment.create({ ...input, companyId: this.companyId }, this.options), 'ASSIGN');
  }
  async revokeApprover(id: number) {
    return this.change(await this.get('approverAssignments', id), { active: false }, 'REVOKE');
  }
  async createDelegation(input: {
    principalUserId: number;
    delegateUserId: number;
    departmentId: number;
    scope: string;
    startsOn: string;
    endsOn: string;
  }) {
    checkDates(input.startsOn, input.endsOn);
    const permission = permissionFor(input.scope);
    if (!input.endsOn || input.principalUserId === input.delegateUserId || this.actor.user.id === input.delegateUserId)
      throw ApiError.badRequest('Independent delegate and end date required');
    const dept = await this.department(input.departmentId);
    const principal = await principalFor(dept, input.scope, input.startsOn, input.endsOn, this.transaction);
    const delegate = await identity(input.delegateUserId, this.transaction, permission);
    if (!principal || principal.user.id !== input.principalUserId || delegate?.employee.companyId !== this.companyId)
      throw ApiError.forbidden('Eligible scoped principal and delegate required');
    const binding = hodRole(input.scope) ? 'hodAssignmentId' : 'approverAssignmentId';
    const conflict = await MovementDelegation.findOne({
      where: {
        principalUserId: input.principalUserId,
        departmentId: dept.id,
        scope: input.scope,
        [binding]: principal.assignment.get('id'),
        active: true,
        ...overlap(input.startsOn, input.endsOn),
      },
      ...this.options,
    });
    if (conflict) throw ApiError.badRequest('Overlapping delegation');
    return this.audit(
      await MovementDelegation.create({ ...input, [binding]: principal.assignment.get('id') }, this.options),
      'DELEGATE',
    );
  }
}
