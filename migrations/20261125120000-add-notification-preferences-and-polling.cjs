/* global module */
'use strict';

const TABLE = 'notification_preferences';
const CATEGORIES = ['LEAVE', 'LOAN', 'TRAINING', 'RELIEVER', 'COMPLAINT', 'GENERAL', 'EXIT'];
const USER_FK = 'notification_preferences_user_id_fk';

const constraintExists = async (queryInterface, table, name) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND CONSTRAINT_NAME = :name`,
    { replacements: { table, name } },
  );
  return rows.length > 0;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const notificationColumns = await queryInterface.describeTable('notifications');
    if (!notificationColumns.in_app_enabled) {
      await queryInterface.addColumn('notifications', 'in_app_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
    if (!notificationColumns.realtime_enabled) {
      // Existing Phase 2 rows must not be replayed as new real-time alerts.
      await queryInterface.addColumn('notifications', 'realtime_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    if (!notificationColumns.realtime_acknowledged_at) {
      await queryInterface.addColumn('notifications', 'realtime_acknowledged_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    await queryInterface.changeColumn('notifications', 'category', {
      type: Sequelize.ENUM(...CATEGORIES),
      allowNull: false,
    });

    if (!(await queryInterface.tableExists(TABLE))) {
      await queryInterface.createTable(
        TABLE,
        {
          user_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
          category: { type: Sequelize.ENUM(...CATEGORIES), allowNull: false, primaryKey: true },
          in_app_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          realtime_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { charset: 'utf8mb4', collate: 'utf8mb4_general_ci' },
      );
    }

    if (!(await constraintExists(queryInterface, TABLE, USER_FK))) {
      await queryInterface.addConstraint(TABLE, {
        fields: ['user_id'],
        type: 'foreign key',
        name: USER_FK,
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const [[rows]] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS count FROM notifications WHERE category = 'EXIT'",
    );
    if (Number(rows.count) > 0) {
      throw new Error('Cannot remove EXIT notification category while EXIT notification records exist.');
    }

    if (await queryInterface.tableExists(TABLE)) {
      await queryInterface.dropTable(TABLE);
    }

    await queryInterface.changeColumn('notifications', 'category', {
      type: Sequelize.ENUM('LEAVE', 'LOAN', 'TRAINING', 'RELIEVER', 'COMPLAINT', 'GENERAL'),
      allowNull: false,
    });

    const columns = await queryInterface.describeTable('notifications');
    for (const column of ['in_app_enabled', 'realtime_enabled', 'realtime_acknowledged_at']) {
      if (columns[column]) await queryInterface.removeColumn('notifications', column);
    }
  },
};
