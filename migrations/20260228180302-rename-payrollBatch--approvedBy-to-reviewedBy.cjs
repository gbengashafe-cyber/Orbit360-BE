'use strict';

const { QueryTypes } = require('sequelize');

/**
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('sequelize').DataTypes} Sequelize
 */
module.exports = {
  up: async (queryInterface) => {
    const tableName = 'payroll_batches';
    const oldColumn = 'approved_by';
    const newColumn = 'reviewed_by';
    const databaseName = queryInterface.sequelize.config.database;

    const results = await queryInterface.sequelize.query(
      `
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = :db
        AND TABLE_NAME = :table
        AND COLUMN_NAME = :column
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      {
        replacements: { db: databaseName, table: tableName, column: oldColumn },
        type: QueryTypes.SELECT,
      },
    );

    const fkInfo = results[0];

    if (fkInfo) {
      await queryInterface.removeConstraint(tableName, fkInfo.CONSTRAINT_NAME);
    }

    await queryInterface.renameColumn(tableName, oldColumn, newColumn);

    if (fkInfo) {
      await queryInterface.addConstraint(tableName, {
        fields: [newColumn],
        type: 'foreign key',
        references: {
          table: fkInfo.REFERENCED_TABLE_NAME,
          field: fkInfo.REFERENCED_COLUMN_NAME,
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  down: async (queryInterface) => {
    const tableName = 'payroll_batches';
    const oldColumn = 'approved_by';
    const newColumn = 'reviewed_by';
    const databaseName = queryInterface.sequelize.config.database;

    const results = await queryInterface.sequelize.query(
      `
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = :db
        AND TABLE_NAME = :table
        AND COLUMN_NAME = :column
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      {
        replacements: { db: databaseName, table: tableName, column: newColumn },
        type: QueryTypes.SELECT,
      },
    );

    const fkInfo = results[0];

    if (fkInfo) {
      await queryInterface.removeConstraint(tableName, fkInfo.CONSTRAINT_NAME);
    }

    await queryInterface.renameColumn(tableName, newColumn, oldColumn);

    if (fkInfo) {
      await queryInterface.addConstraint(tableName, {
        fields: [oldColumn],
        type: 'foreign key',
        references: {
          table: fkInfo.REFERENCED_TABLE_NAME,
          field: fkInfo.REFERENCED_COLUMN_NAME,
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },
};
