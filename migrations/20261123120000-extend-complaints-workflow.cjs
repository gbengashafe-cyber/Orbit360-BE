/* global module */
'use strict';

/**
 * Extends `complaints` for the two-stage Staff Complaints workflow.
 * Additive and idempotent: every step checks the current schema first, and nothing is dropped.
 *
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('sequelize').DataTypes} Sequelize
 */

const TABLE = 'complaints';
const NEW_STATUSES = ['PENDING_REVIEW', 'PENDING_APPROVAL', 'REJECTED_BY_REVIEWER', 'REJECTED_BY_APPROVER', 'APPROVED'];
const LEGACY_STATUSES = ['open', 'under_review', 'resolved', 'closed'];
const REFERENCE_INDEX = 'complaints_reference_unique';
const EMPLOYEE_FK = 'complaints_employee_id_fk';
const REVIEWED_BY_FK = 'complaints_reviewed_by_fk';
const APPROVED_BY_FK = 'complaints_approved_by_fk';

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
    const definition = await queryInterface.describeTable(TABLE);

    const columns = {
      reference: { type: Sequelize.STRING(20), allowNull: true },
      is_anonymous: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      incident_date: { type: Sequelize.DATEONLY, allowNull: true },
      witnesses: { type: Sequelize.TEXT, allowNull: true },
      reviewed_by: { type: Sequelize.INTEGER, allowNull: true },
      reviewer_note: { type: Sequelize.TEXT, allowNull: true },
      reviewed_date: { type: Sequelize.DATE, allowNull: true },
      approved_by: { type: Sequelize.INTEGER, allowNull: true },
      approver_note: { type: Sequelize.TEXT, allowNull: true },
      approved_date: { type: Sequelize.DATE, allowNull: true },
    };

    for (const [name, spec] of Object.entries(columns)) {
      if (!definition[name]) {
        await queryInterface.addColumn(TABLE, name, spec);
      }
    }

    // Status: add the new values alongside the legacy ones, then map any legacy rows.
    await queryInterface.changeColumn(TABLE, 'status', {
      type: Sequelize.ENUM(...NEW_STATUSES, ...LEGACY_STATUSES),
      allowNull: true,
      defaultValue: 'PENDING_REVIEW',
    });
    await queryInterface.sequelize.query(
      `UPDATE ${TABLE} SET status = 'PENDING_REVIEW' WHERE status IN ('open', 'under_review') OR status IS NULL`,
    );
    await queryInterface.sequelize.query(`UPDATE ${TABLE} SET status = 'APPROVED' WHERE status IN ('resolved', 'closed')`);
    await queryInterface.changeColumn(TABLE, 'status', {
      type: Sequelize.ENUM(...NEW_STATUSES, ...LEGACY_STATUSES),
      allowNull: false,
      defaultValue: 'PENDING_REVIEW',
    });

    // Reference for any existing rows, then enforce uniqueness.
    await queryInterface.sequelize.query(
      `UPDATE ${TABLE} SET reference = CONCAT('CMP-', YEAR(created_at), '-', LPAD(id, 6, '0')) WHERE reference IS NULL`,
    );
    if (!(await indexExists(queryInterface, REFERENCE_INDEX))) {
      await queryInterface.addIndex(TABLE, ['reference'], { unique: true, name: REFERENCE_INDEX });
    }

    // Foreign keys. Refuse to continue if existing rows would violate them.
    const [[orphans]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) AS n FROM ${TABLE} c LEFT JOIN employees e ON e.id = c.employee_id WHERE e.id IS NULL`,
    );
    if (Number(orphans.n) > 0) {
      throw new Error(`${orphans.n} complaint(s) reference missing employees. Fix them before running this migration.`);
    }

    if (!(await constraintExists(queryInterface, EMPLOYEE_FK))) {
      await queryInterface.addConstraint(TABLE, {
        fields: ['employee_id'],
        type: 'foreign key',
        name: EMPLOYEE_FK,
        references: { table: 'employees', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }
    if (!(await constraintExists(queryInterface, REVIEWED_BY_FK))) {
      await queryInterface.addConstraint(TABLE, {
        fields: ['reviewed_by'],
        type: 'foreign key',
        name: REVIEWED_BY_FK,
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    if (!(await constraintExists(queryInterface, APPROVED_BY_FK))) {
      await queryInterface.addConstraint(TABLE, {
        fields: ['approved_by'],
        type: 'foreign key',
        name: APPROVED_BY_FK,
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    for (const name of [APPROVED_BY_FK, REVIEWED_BY_FK, EMPLOYEE_FK]) {
      if (await constraintExists(queryInterface, name)) {
        await queryInterface.removeConstraint(TABLE, name);
      }
    }
    if (await indexExists(queryInterface, REFERENCE_INDEX)) {
      await queryInterface.removeIndex(TABLE, REFERENCE_INDEX);
    }

    // Map new statuses back to the closest legacy value before narrowing the enum.
    await queryInterface.changeColumn(TABLE, 'status', {
      type: Sequelize.ENUM(...NEW_STATUSES, ...LEGACY_STATUSES),
      allowNull: true,
      defaultValue: 'open',
    });
    await queryInterface.sequelize.query(`UPDATE ${TABLE} SET status = 'open' WHERE status = 'PENDING_REVIEW'`);
    await queryInterface.sequelize.query(`UPDATE ${TABLE} SET status = 'under_review' WHERE status = 'PENDING_APPROVAL'`);
    await queryInterface.sequelize.query(
      `UPDATE ${TABLE} SET status = 'closed' WHERE status IN ('APPROVED', 'REJECTED_BY_REVIEWER', 'REJECTED_BY_APPROVER')`,
    );
    await queryInterface.changeColumn(TABLE, 'status', {
      type: Sequelize.ENUM(...LEGACY_STATUSES),
      allowNull: true,
      defaultValue: 'open',
    });

    const definition = await queryInterface.describeTable(TABLE);
    for (const name of [
      'approved_date',
      'approver_note',
      'approved_by',
      'reviewed_date',
      'reviewer_note',
      'reviewed_by',
      'witnesses',
      'incident_date',
      'is_anonymous',
      'reference',
    ]) {
      if (definition[name]) {
        await queryInterface.removeColumn(TABLE, name);
      }
    }
  },
};
