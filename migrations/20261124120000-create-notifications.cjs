/* global module */
'use strict';

/**
 * Creates the `notifications` table for the Notification Center.
 * Additive and idempotent: every step checks the current schema first. No existing table is altered.
 * `down` removes only the objects this migration creates (the table, which takes its indexes and foreign keys with it).
 *
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('sequelize').DataTypes} Sequelize
 */

const TABLE = 'notifications';
const CATEGORIES = ['LEAVE', 'LOAN', 'TRAINING', 'RELIEVER', 'COMPLAINT', 'GENERAL'];

const RECIPIENT_FK = 'notifications_recipient_user_id_fk';
const ACTOR_FK = 'notifications_actor_user_id_fk';

// dedupe_key is NOT NULL on purpose: MySQL allows any number of NULLs in a UNIQUE index,
// so a nullable key would not stop duplicate deliveries.
const INDEXES = [
  { name: 'notifications_recipient_dedupe_unique', fields: ['recipient_user_id', 'dedupe_key'], unique: true },
  { name: 'notifications_recipient_read_idx', fields: ['recipient_user_id', 'read_at'] },
  { name: 'notifications_recipient_feed_idx', fields: ['recipient_user_id', 'created_at', 'id'] },
  { name: 'notifications_recipient_category_feed_idx', fields: ['recipient_user_id', 'category', 'created_at', 'id'] },
];

const constraintExists = async (queryInterface, name) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND CONSTRAINT_NAME = :name`,
    { replacements: { table: TABLE, name } },
  );
  return rows.length > 0;
};

const indexExists = async (queryInterface, name) => {
  const indexes = await queryInterface.showIndex(TABLE);
  return indexes.some((index) => index.name === name);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await queryInterface.tableExists(TABLE))) {
      await queryInterface.createTable(
        TABLE,
        {
          id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
          recipient_user_id: { type: Sequelize.INTEGER, allowNull: false },
          category: { type: Sequelize.ENUM(...CATEGORIES), allowNull: false },
          event_type: { type: Sequelize.STRING(64), allowNull: false },
          // VARCHAR (not ENUM) so later phases can add audiences without altering the table.
          audience: { type: Sequelize.STRING(32), allowNull: false },
          title: { type: Sequelize.STRING(150), allowNull: false },
          message: { type: Sequelize.TEXT, allowNull: false },
          entity_type: { type: Sequelize.STRING(40), allowNull: true },
          entity_id: { type: Sequelize.STRING(40), allowNull: true },
          actor_user_id: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: Sequelize.JSON, allowNull: true },
          dedupe_key: { type: Sequelize.STRING(191), allowNull: false },
          read_at: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { charset: 'utf8mb4', collate: 'utf8mb4_general_ci' },
      );
    }

    for (const { name, fields, unique } of INDEXES) {
      if (!(await indexExists(queryInterface, name))) {
        await queryInterface.addIndex(TABLE, fields, { name, unique: !!unique });
      }
    }

    // Notifications belong to the recipient's account: removing the user row removes them.
    // (Users are soft-deleted (paranoid), so this only applies to a hard delete.)
    if (!(await constraintExists(queryInterface, RECIPIENT_FK))) {
      await queryInterface.addConstraint(TABLE, {
        fields: ['recipient_user_id'],
        type: 'foreign key',
        name: RECIPIENT_FK,
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    // Same behaviour as complaints.reviewed_by / approved_by.
    if (!(await constraintExists(queryInterface, ACTOR_FK))) {
      await queryInterface.addConstraint(TABLE, {
        fields: ['actor_user_id'],
        type: 'foreign key',
        name: ACTOR_FK,
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    if (await queryInterface.tableExists(TABLE)) {
      await queryInterface.dropTable(TABLE);
    }
  },
};
