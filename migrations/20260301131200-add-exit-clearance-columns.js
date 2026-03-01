'use strict';

/**
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('sequelize').DataTypes} Sequelize
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableName = 'exits';
      const tableDefinition = await queryInterface.describeTable(tableName, { transaction });

      if (!tableDefinition.it_admin_clearance) {
        await queryInterface.addColumn(
          tableName,
          'it_admin_clearance',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }

      if (!tableDefinition.supervisor_clearance) {
        await queryInterface.addColumn(
          tableName,
          'supervisor_clearance',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }

      if (!tableDefinition.finance_clearance) {
        await queryInterface.addColumn(
          tableName,
          'finance_clearance',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }

      if (!tableDefinition.hr_clearance) {
        await queryInterface.addColumn(
          tableName,
          'hr_clearance',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableName = 'exits';
      const tableDefinition = await queryInterface.describeTable(tableName, { transaction });

      if (tableDefinition.it_admin_clearance) {
        await queryInterface.removeColumn(tableName, 'it_admin_clearance', { transaction });
      }

      if (tableDefinition.supervisor_clearance) {
        await queryInterface.removeColumn(tableName, 'supervisor_clearance', { transaction });
      }

      if (tableDefinition.finance_clearance) {
        await queryInterface.removeColumn(tableName, 'finance_clearance', { transaction });
      }

      if (tableDefinition.hr_clearance) {
        await queryInterface.removeColumn(tableName, 'hr_clearance', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};

