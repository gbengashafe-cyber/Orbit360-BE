'use strict';

const categories = [
  ['INTERDEPARTMENTAL_TRANSFER', 'Interdepartmental transfer'], ['INTERBRANCH_TRANSFER', 'Interbranch transfer'],
  ['LOCATION_TRANSFER', 'Location transfer'], ['JOB_ROTATION', 'Job rotation'], ['REDEPLOYMENT', 'Redeployment'],
  ['SECONDMENT', 'Secondment'], ['PROMOTION_RELATED', 'Promotion-related movement'], ['INTRAGROUP_TRANSFER', 'Intragroup transfer'],
];
const tables = ['sm_categories', 'sm_legal_entities', 'sm_branches', 'sm_locations', 'sm_grades', 'sm_cost_centres',
  'sm_positions', 'sm_headcounts', 'sm_workflows', 'sm_workflow_versions', 'sm_approval_stages', 'sm_requests',
  'sm_assignment_snapshots', 'sm_approval_decisions', 'sm_hod_assignments', 'sm_delegations'];

module.exports = {
  async up(q, S) {
    const id = () => ({ type: S.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false });
    const fk = (table, nullable = false) => ({ type: S.INTEGER, allowNull: nullable, references: { model: table, key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' });
    const timestamps = () => ({ created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false } });
    const text = (size = 120) => ({ type: S.STRING(size), allowNull: false });
    const active = () => ({ type: S.BOOLEAN, allowNull: false, defaultValue: true });
    await q.createTable('sm_categories', { id: id(), code: { ...text(60), unique: true }, name: text(), active: active(), settings: { type: S.JSON, allowNull: true }, ...timestamps() });
    for (const table of ['sm_legal_entities', 'sm_branches', 'sm_locations', 'sm_grades', 'sm_cost_centres']) {
      await q.createTable(table, { id: id(), company_id: fk('companies'), code: text(60), name: text(), active: active(), ...timestamps() });
      await q.addIndex(table, ['company_id', 'code'], { unique: true, name: `${table}_company_code_uq` });
    }
    await q.createTable('sm_positions', { id: id(), department_id: fk('departments'), job_role_id: fk('job_roles'), code: text(60), name: text(), active: active(), ...timestamps() });
    await q.addIndex('sm_positions', ['department_id', 'code'], { unique: true, name: 'sm_position_department_code_uq' });
    await q.createTable('sm_headcounts', { id: id(), department_id: fk('departments'), position_id: fk('sm_positions'), approved_count: { type: S.INTEGER.UNSIGNED, allowNull: false }, effective_from: { type: S.DATEONLY, allowNull: false }, effective_to: { type: S.DATEONLY, allowNull: true }, ...timestamps() });
    await q.createTable('sm_workflows', { id: id(), category_id: fk('sm_categories'), name: text(), active: active(), ...timestamps() });
    await q.createTable('sm_workflow_versions', { id: id(), workflow_id: fk('sm_workflows'), version: { type: S.INTEGER.UNSIGNED, allowNull: false }, status: { type: S.STRING(16), allowNull: false, defaultValue: 'DRAFT' }, settings: { type: S.JSON, allowNull: false }, ...timestamps() });
    await q.addIndex('sm_workflow_versions', ['workflow_id', 'version'], { unique: true, name: 'sm_workflow_version_uq' });
    await q.createTable('sm_approval_stages', { id: id(), version_id: fk('sm_workflow_versions'), stage_order: { type: S.INTEGER.UNSIGNED, allowNull: false }, stage_code: text(40), authority: text(60), scope: text(30), mandatory: active(), settings: { type: S.JSON, allowNull: false }, ...timestamps() });
    await q.addIndex('sm_approval_stages', ['version_id', 'stage_order'], { unique: true, name: 'sm_stage_order_uq' });
    await q.addIndex('sm_approval_stages', ['version_id', 'stage_code'], { unique: true, name: 'sm_stage_code_uq' });
    await q.createTable('sm_requests', { id: id(), employee_id: fk('employees'), category_id: fk('sm_categories'), workflow_version_id: fk('sm_workflow_versions'), initiated_by: fk('users'), status: { type: S.STRING(40), allowNull: false, defaultValue: 'DRAFT' }, effective_date: { type: S.DATEONLY, allowNull: false }, revision: { type: S.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 }, ...timestamps() });
    await q.addIndex('sm_requests', ['employee_id', 'status'], { name: 'sm_request_employee_status_idx' });
    await q.createTable('sm_assignment_snapshots', { id: id(), request_id: fk('sm_requests'), kind: text(12), assignment: { type: S.JSON, allowNull: false }, ...timestamps() });
    await q.addIndex('sm_assignment_snapshots', ['request_id', 'kind'], { unique: true, name: 'sm_snapshot_request_kind_uq' });
    await q.createTable('sm_approval_decisions', { id: id(), request_id: fk('sm_requests'), stage_id: fk('sm_approval_stages'), actor_user_id: fk('users'), decision: text(40), notes: { type: S.TEXT, allowNull: true }, ...timestamps() });
    await q.createTable('sm_hod_assignments', { id: id(), department_id: fk('departments'), employee_id: fk('employees'), starts_on: { type: S.DATEONLY, allowNull: false }, ends_on: { type: S.DATEONLY, allowNull: true }, acting: { type: S.BOOLEAN, allowNull: false, defaultValue: false }, active: active(), ...timestamps() });
    await q.addIndex('sm_hod_assignments', ['department_id', 'active', 'starts_on', 'ends_on'], { name: 'sm_hod_scope_dates_idx' });
    await q.createTable('sm_delegations', { id: id(), principal_user_id: fk('users'), delegate_user_id: fk('users'), department_id: fk('departments'), scope: text(60), starts_on: { type: S.DATEONLY, allowNull: false }, ends_on: { type: S.DATEONLY, allowNull: false }, active: active(), ...timestamps() });
    await q.addIndex('sm_delegations', ['principal_user_id', 'department_id', 'scope', 'active', 'starts_on', 'ends_on'], { name: 'sm_delegation_scope_dates_idx' });
    const now = new Date();
    await q.bulkInsert('sm_categories', categories.map(([code, name]) => ({ code, name, active: true, created_at: now, updated_at: now })));
  },
  async down(q) {
    for (const table of [...tables].reverse()) {
      const [rows] = await q.sequelize.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      if (Number(rows[0].total) && table !== 'sm_categories') throw new Error(`Cannot remove nonempty ${table}`);
    }
    const [categories] = await q.sequelize.query('SELECT code, name, active, settings FROM `sm_categories`');
    if (categories.length !== 8 || categories.some((row) => !categoriesMatch(row))) throw new Error('Cannot remove changed movement categories');
    for (const table of [...tables].reverse()) await q.dropTable(table);
  },
};
function categoriesMatch(row) { return categories.some(([code, name]) => row.code === code && row.name === name) && Boolean(row.active) && row.settings == null; }
