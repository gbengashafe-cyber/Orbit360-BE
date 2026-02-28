"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable('hr_document_deletion_requests', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        documentOrFolderId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'document_or_folder_id',
        },
        deletionType: {
            type: sequelize_1.DataTypes.ENUM('DOCUMENT', 'FOLDER'),
            allowNull: false,
            field: 'deletion_type',
        },
        itemName: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            field: 'item_name',
        },
        requestedBy: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'requested_by',
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
        reviewedBy: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            field: 'reviewed_by',
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED'),
            defaultValue: 'PENDING_APPROVAL',
            allowNull: false,
        },
        requesterComment: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'requester_comment',
        },
        reviewerComment: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'reviewer_comment',
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
            field: 'created_at',
        },
        reviewedDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            field: 'reviewed_date',
        },
    });
    // Add indexes
    await queryInterface.addIndex('hr_document_deletion_requests', ['document_or_folder_id']);
    await queryInterface.addIndex('hr_document_deletion_requests', ['requested_by']);
    await queryInterface.addIndex('hr_document_deletion_requests', ['reviewed_by']);
    await queryInterface.addIndex('hr_document_deletion_requests', ['status']);
    await queryInterface.addIndex('hr_document_deletion_requests', ['deletion_type']);
}
exports.up = up;
async function down(queryInterface) {
    await queryInterface.dropTable('hr_document_deletion_requests');
}
exports.down = down;
