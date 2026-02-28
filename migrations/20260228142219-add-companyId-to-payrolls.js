module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('payroll_batches', 'updated_at');

      await queryInterface.addColumn(
        'Payrolls',
        'company_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'payroll_batches',
        'company_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE Payrolls p 
        SET company_id = (
          SELECT company_id FROM employees WHERE employee_id = p.employee_id LIMIT 1
        )
        WHERE p.company_id IS NULL;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE payroll_batches pb SET company_id = (SELECT company_id FROM Payrolls WHERE batch_id = pb.batch_id LIMIT 1) WHERE pb.company_id IS NULL;
        `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'Payrolls',
        'company_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Companies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'payroll_batches',
        'company_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Companies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Payrolls', 'company_id', { transaction });
      await queryInterface.removeColumn('payroll_batches', 'company_id', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
