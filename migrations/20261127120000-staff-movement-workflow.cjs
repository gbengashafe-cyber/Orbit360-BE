'use strict';
module.exports = {
  async up(q, S) {
    const fk = (model, allowNull = false) => ({
      type: S.INTEGER,
      allowNull,
      references: { model, key: 'id' },
      onDelete: 'RESTRICT',
    });
    if (!(await q.showAllTables()).includes('sm_request_details'))
      await q.createTable('sm_request_details', {
        id: { ...fk('sm_requests'), primaryKey: true },
        company_id: fk('companies'),
        current_department_id: fk('departments'),
        proposed_department_id: fk('departments'),
        hr_user_id: fk('users', true),
        reference: { type: S.STRING(40), unique: 'sm_movement_reference_uq' },
        path: { type: S.STRING(32), allowNull: false },
        form: { type: S.JSON, allowNull: false },
        routing: { type: S.JSON, allowNull: false },
        created_at: { type: S.DATE, allowNull: false },
        updated_at: { type: S.DATE, allowNull: false },
      });
    const columns = await q.describeTable('sm_approval_decisions');
    if (!columns.evidence) await q.addColumn('sm_approval_decisions', 'evidence', { type: S.JSON });
    if (!columns.request_revision) await q.addColumn('sm_approval_decisions', 'request_revision', { type: S.INTEGER });
  },
  async down() {
    throw new Error('Workflow history requires a reviewed archival rollback');
  },
};
