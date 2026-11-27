'use strict';
const original = ['LEAVE', 'LOAN', 'TRAINING', 'RELIEVER', 'COMPLAINT', 'GENERAL', 'EXIT', 'EMPLOYEE_MANAGEMENT', 'RECRUITMENT', 'PAYROLL', 'DOCUMENTS', 'ONBOARDING'];
const tables = ['notifications', 'notification_preferences'];
async function change(q, S, categories) {
  for (const table of tables) await q.changeColumn(table, 'category', { type: S.ENUM(...categories), allowNull: false });
}
module.exports = {
  up: (q, S) => change(q, S, [...original, 'STAFF_MOVEMENT']),
  async down(q, S) {
    for (const table of tables) {
      const [rows] = await q.sequelize.query(`SELECT COUNT(*) AS total FROM \`${table}\` WHERE category = 'STAFF_MOVEMENT'`);
      if (Number(rows[0].total)) throw new Error(`Staff Movement category is in use in ${table}`);
    }
    await change(q, S, original);
  },
};
