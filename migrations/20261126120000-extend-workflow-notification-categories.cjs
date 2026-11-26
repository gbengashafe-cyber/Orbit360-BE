const original = ['LEAVE', 'LOAN', 'TRAINING', 'RELIEVER', 'COMPLAINT', 'GENERAL', 'EXIT'];
const added = ['EMPLOYEE_MANAGEMENT', 'RECRUITMENT', 'PAYROLL', 'DOCUMENTS', 'ONBOARDING'];
const tables = ['notifications', 'notification_preferences'];

async function setCategories(queryInterface, Sequelize, categories) {
  for (const table of tables) {
    await queryInterface.changeColumn(table, 'category', {
      type: Sequelize.ENUM(...categories), allowNull: false,
    });
  }
}

module.exports = {
  up: (queryInterface, Sequelize) => setCategories(queryInterface, Sequelize, [...original, ...added]),
  async down(queryInterface, Sequelize) {
    for (const table of tables) {
      const [rows] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) AS total FROM ' + table + ' WHERE category IN (:added)', { replacements: { added } },
      );
      if (Number(rows[0].total)) throw new Error('Workflow categories are in use in ' + table);
    }
    await setCategories(queryInterface, Sequelize, original);
  },
};
