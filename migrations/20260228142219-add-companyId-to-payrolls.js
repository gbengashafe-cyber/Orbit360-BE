module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const payrollsDefinition = await queryInterface.describeTable('payrolls', { transaction });
      const payrollBatchesDefinition = await queryInterface.describeTable('payroll_batches', { transaction });

      if (payrollsDefinition.company_id) {
        await queryInterface.removeColumn('payrolls', 'company_id', { transaction });
      }

      if (payrollBatchesDefinition.company_id) {
        await queryInterface.removeColumn('payroll_batches', 'company_id', { transaction });
      }

      await queryInterface.addColumn(
        'payrolls',
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
        UPDATE payrolls p 
        SET company_id = (
          SELECT company_id FROM employees WHERE employee_id = p.employee_id LIMIT 1
        )
        WHERE p.company_id IS NULL;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE payroll_batches pb SET company_id = (SELECT company_id FROM payrolls WHERE batch_id = pb.batch_id LIMIT 1) WHERE pb.company_id IS NULL;
        `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'payrolls',
        'company_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'companies',
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
            model: 'companies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ error:', error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const payrollsDefinition = await queryInterface.describeTable('payrolls', { transaction });
      const payrollBatchesDefinition = await queryInterface.describeTable('payroll_batches', { transaction });

      if (payrollsDefinition.company_id) {
        await queryInterface.removeColumn('payrolls', 'company_id', { transaction });
      }

      if (payrollBatchesDefinition.company_id) {
        await queryInterface.removeColumn('payroll_batches', 'company_id', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
