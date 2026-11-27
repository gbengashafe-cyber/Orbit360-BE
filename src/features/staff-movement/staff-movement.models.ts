import { DataTypes, Model, ModelStatic, Transaction } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';
import { Department } from '../department/department.model';
import { Company } from '../company/company.model';
import { JobRole } from '../job-role/job-role.model';

const id = { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true };
const required = () => ({ type: DataTypes.INTEGER, allowNull: false });
const str = (length = 120) => ({ type: DataTypes.STRING(length), allowNull: false });
const date = () => ({ type: DataTypes.DATEONLY, allowNull: false });
const active = () => ({ type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
const define = (tableName: string, fields: Record<string, unknown>): ModelStatic<Model> =>
  db.define(tableName, { id, ...fields } as never, { tableName, underscored: true, timestamps: true });

export const MovementCategory = define('sm_categories', {
  code: str(60),
  name: str(),
  active: active(),
  settings: DataTypes.JSON,
});
const organization = (table: string) => define(table, { companyId: required(), code: str(60), name: str(), active: active() });
export const MovementLegalEntity = organization('sm_legal_entities');
export const MovementBranch = organization('sm_branches');
export const MovementLocation = organization('sm_locations');
export const MovementGrade = organization('sm_grades');
export const MovementCostCentre = organization('sm_cost_centres');
export const MovementPosition = define('sm_positions', {
  departmentId: required(),
  jobRoleId: required(),
  code: str(60),
  name: str(),
  active: active(),
});
export const MovementHeadcount = define('sm_headcounts', {
  departmentId: required(),
  positionId: required(),
  approvedCount: required(),
  effectiveFrom: date(),
  effectiveTo: DataTypes.DATEONLY,
});
export const MovementWorkflow = define('sm_workflows', {
  companyId: DataTypes.INTEGER,
  categoryId: required(),
  name: str(),
  active: active(),
});
export const MovementWorkflowVersion = define('sm_workflow_versions', {
  workflowId: required(),
  version: required(),
  status: str(16),
  settings: DataTypes.JSON,
});
export const MovementApprovalStage = define('sm_approval_stages', {
  versionId: required(),
  stageOrder: required(),
  stageCode: str(40),
  authority: str(60),
  scope: str(30),
  mandatory: active(),
  settings: DataTypes.JSON,
});
export const MovementRequest = define('sm_requests', {
  employeeId: required(),
  categoryId: required(),
  workflowVersionId: required(),
  initiatedBy: required(),
  status: str(40),
  effectiveDate: date(),
  revision: required(),
});
export const MovementAssignmentSnapshot = define('sm_assignment_snapshots', {
  requestId: required(),
  kind: str(12),
  assignment: { type: DataTypes.JSON, allowNull: false },
});
export const MovementApprovalDecision = define('sm_approval_decisions', {
  requestId: required(),
  stageId: required(),
  actorUserId: required(),
  decision: str(40),
  notes: DataTypes.TEXT,
});
export const MovementHodAssignment = define('sm_hod_assignments', {
  departmentId: required(),
  employeeId: required(),
  startsOn: date(),
  endsOn: DataTypes.DATEONLY,
  acting: { type: DataTypes.BOOLEAN, defaultValue: false },
  active: active(),
});
export const MovementDelegation = define('sm_delegations', {
  hodAssignmentId: DataTypes.INTEGER,
  approverAssignmentId: DataTypes.INTEGER,
  principalUserId: required(),
  delegateUserId: required(),
  departmentId: required(),
  scope: str(60),
  startsOn: date(),
  endsOn: date(),
  active: active(),
});

for (const model of [MovementLegalEntity, MovementBranch, MovementLocation, MovementGrade, MovementCostCentre])
  model.belongsTo(Company, { foreignKey: 'companyId' });
MovementPosition.belongsTo(Department, { foreignKey: 'departmentId' });
MovementPosition.belongsTo(JobRole, { foreignKey: 'jobRoleId' });
MovementHeadcount.belongsTo(Department, { foreignKey: 'departmentId' });
MovementHeadcount.belongsTo(MovementPosition, { foreignKey: 'positionId' });
MovementWorkflow.belongsTo(MovementCategory, { foreignKey: 'categoryId' });
MovementWorkflow.hasMany(MovementWorkflowVersion, { foreignKey: 'workflowId', as: 'versions' });
MovementWorkflowVersion.belongsTo(MovementWorkflow, { foreignKey: 'workflowId' });
MovementWorkflowVersion.hasMany(MovementApprovalStage, { foreignKey: 'versionId', as: 'stages' });
MovementApprovalStage.belongsTo(MovementWorkflowVersion, { foreignKey: 'versionId' });
MovementRequest.belongsTo(Employee, { foreignKey: 'employeeId' });
MovementRequest.belongsTo(User, { foreignKey: 'initiatedBy', as: 'initiator' });
MovementRequest.belongsTo(MovementCategory, { foreignKey: 'categoryId' });
MovementRequest.belongsTo(MovementWorkflowVersion, { foreignKey: 'workflowVersionId' });
MovementRequest.hasMany(MovementAssignmentSnapshot, { foreignKey: 'requestId', as: 'snapshots' });
MovementRequest.hasMany(MovementApprovalDecision, { foreignKey: 'requestId', as: 'decisions' });
MovementAssignmentSnapshot.belongsTo(MovementRequest, { foreignKey: 'requestId' });
MovementApprovalDecision.belongsTo(MovementRequest, { foreignKey: 'requestId' });
MovementApprovalDecision.belongsTo(MovementApprovalStage, { foreignKey: 'stageId' });
MovementApprovalDecision.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor' });
MovementHodAssignment.belongsTo(Department, { foreignKey: 'departmentId' });
MovementHodAssignment.belongsTo(Employee, { foreignKey: 'employeeId' });
MovementDelegation.belongsTo(Department, { foreignKey: 'departmentId' });
MovementDelegation.belongsTo(User, { foreignKey: 'principalUserId', as: 'principal' });
MovementDelegation.belongsTo(User, { foreignKey: 'delegateUserId', as: 'delegate' });

export const MovementApproverAssignment = define('sm_approver_assignments', {
  companyId: required(),
  departmentId: DataTypes.INTEGER,
  userId: required(),
  authority: str(60),
  startsOn: date(),
  endsOn: DataTypes.DATEONLY,
  active: active(),
});
export const MovementAudit = define('sm_audit_events', {
  actorUserId: required(),
  resource: str(64),
  recordId: required(),
  action: str(40),
  changes: { type: DataTypes.JSON, allowNull: false },
});

const protectedWrite = () => {
  throw new Error('Protected Staff Movement history');
};
for (const model of [
  MovementAudit,
  MovementWorkflowVersion,
  MovementApprovalStage,
  MovementRequest,
  MovementAssignmentSnapshot,
]) {
  model.beforeDestroy(protectedWrite);
  model.beforeBulkDestroy(protectedWrite);
  model.beforeBulkUpdate(protectedWrite);
  model.addHook('beforeUpsert', protectedWrite);
  model.beforeBulkCreate((_rows, options) => {
    if (options.updateOnDuplicate) protectedWrite();
  });
}
for (const model of [MovementAudit, MovementApprovalStage, MovementAssignmentSnapshot]) model.beforeUpdate(protectedWrite);

async function requireDraftStages(stages: Model[], transaction?: Transaction | null) {
  if (!transaction) throw new Error('Stage creation requires a transaction');
  for (const versionId of new Set(stages.map((row) => Number(row.get('versionId'))))) {
    const version = await MovementWorkflowVersion.findByPk(versionId, { transaction, lock: transaction.LOCK.UPDATE });
    if (
      version?.get('status') !== 'DRAFT' ||
      (await MovementRequest.count({ where: { workflowVersionId: versionId }, transaction }))
    )
      protectedWrite();
  }
}
MovementApprovalStage.beforeCreate((row, { transaction }) => requireDraftStages([row], transaction));
MovementApprovalStage.beforeBulkCreate((rows, { transaction }) => requireDraftStages(rows, transaction));
const lifecycleWrites = new WeakSet<Model>();
MovementWorkflowVersion.beforeUpdate((row) => {
  if (!lifecycleWrites.has(row) || (row.changed() || []).some((key) => !['status', 'updatedAt'].includes(key))) protectedWrite();
});
export async function changeVersionStatus(row: Model, status: 'ACTIVE' | 'RETIRED', transaction: Transaction) {
  if (row.get('status') !== (status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE')) protectedWrite();
  lifecycleWrites.add(row);
  try {
    return await row.update({ status }, { transaction });
  } finally {
    lifecycleWrites.delete(row);
  }
}

MovementWorkflowVersion.beforeCreate((row) => {
  if (row.get('status') !== 'DRAFT') protectedWrite();
});
MovementWorkflowVersion.beforeBulkCreate(protectedWrite);
MovementRequest.beforeUpdate(protectedWrite);
MovementRequest.beforeBulkCreate(protectedWrite);
MovementRequest.beforeCreate(async (row, { transaction }) => {
  if (!transaction || row.get('status') !== 'DRAFT' || row.get('revision') !== 1) protectedWrite();
  const version = await MovementWorkflowVersion.findByPk(Number(row.get('workflowVersionId')), { transaction, lock: true });
  if (version?.get('status') !== 'ACTIVE') protectedWrite();
  const workflow = await MovementWorkflow.findByPk(Number(version?.get('workflowId')), { transaction });
  const employee = await Employee.findByPk(Number(row.get('employeeId')), { transaction });
  if (!employee || (workflow?.get('companyId') != null && workflow.get('companyId') !== employee.companyId)) protectedWrite();
  if (!workflow?.get('active') || workflow.get('categoryId') !== row.get('categoryId')) protectedWrite();
});
