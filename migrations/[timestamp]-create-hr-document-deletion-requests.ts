import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('hr_document_deletion_requests', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    documentOrFolderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'document_or_folder_id',
    },
    deletionType: {
      type: DataTypes.ENUM('DOCUMENT', 'FOLDER'),
      allowNull: false,
      field: 'deletion_type',
    },
    itemName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'item_name',
    },
    requestedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'requested_by',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    status: {
      type: DataTypes.ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING_APPROVAL',
      allowNull: false,
    },
    requesterComment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'requester_comment',
    },
    reviewerComment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reviewer_comment',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    reviewedDate: {
      type: DataTypes.DATE,
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

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('hr_document_deletion_requests');
}
