module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('onboardings', 'decision_version', {
      type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('onboardings', 'decision_version');
  },
};
