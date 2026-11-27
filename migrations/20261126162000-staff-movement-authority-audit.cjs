'use strict';

module.exports = {
  async up(q, S) {
    const fk = (table, allowNull = false) => ({
      type: S.INTEGER,
      allowNull,
      references: { model: table, key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
    const id = { type: S.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false };
    const timestamps = { created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false } };
    const tables = await q.showAllTables();
    if (!tables.includes('sm_approver_assignments')) {
      await q.createTable('sm_approver_assignments', {
        id,
        company_id: fk('companies'),
        department_id: fk('departments', true),
        user_id: fk('users'),
        authority: { type: S.STRING(60), allowNull: false },
        starts_on: { type: S.DATEONLY, allowNull: false },
        ends_on: { type: S.DATEONLY },
        active: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
        ...timestamps,
      });
    }
    if (!tables.includes('sm_audit_events')) {
      await q.createTable('sm_audit_events', {
        id,
        actor_user_id: fk('users'),
        resource: { type: S.STRING(64), allowNull: false },
        record_id: { type: S.INTEGER, allowNull: false },
        action: { type: S.STRING(40), allowNull: false },
        changes: { type: S.JSON, allowNull: false },
        ...timestamps,
      });
    }
    const columns = await q.describeTable('sm_delegations');
    if (!columns.hod_assignment_id) await q.addColumn('sm_delegations', 'hod_assignment_id', fk('sm_hod_assignments', true));
    if (!columns.approver_assignment_id)
      await q.addColumn('sm_delegations', 'approver_assignment_id', fk('sm_approver_assignments', true));
    if (!(await q.describeTable('sm_workflows')).company_id)
      await q.addColumn('sm_workflows', 'company_id', fk('companies', true));
  },
  async down() {
    throw new Error('Rollback requires review of persisted audit, assignment and workflow ownership history');
  },
};
