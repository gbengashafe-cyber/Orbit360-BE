import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';

export const deletionRequestStatus = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const;
export const DELETION_TYPES = ['DOCUMENT', 'FOLDER'] as const;

export class HRDocumentDeletionRequest extends Model<
  InferAttributes<HRDocumentDeletionRequest>,
  InferCreationAttributes<HRDocumentDeletionRequest>
> {
  declare id: CreationOptional<number>;
  declare documentOrFolderId: string;
  declare deletionType: (typeof DELETION_TYPES)[number];
  declare itemName: string;
  declare requestedBy: number;
  declare reviewedBy: CreationOptional<number>;
  declare status: CreationOptional<(typeof deletionRequestStatus)[number]>;
  declare requesterComment: CreationOptional<string>;
  declare reviewerComment: CreationOptional<string>;
  declare reviewedDate: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
}

HRDocumentDeletionRequest.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    documentOrFolderId: { type: DataTypes.UUID, allowNull: false },
    deletionType: { type: DataTypes.ENUM(...DELETION_TYPES), allowNull: false },
    itemName: { type: DataTypes.STRING(255), allowNull: false },
    requestedBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    reviewedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: User, key: 'id' } },
    status: { type: DataTypes.ENUM(...deletionRequestStatus), defaultValue: 'PENDING_APPROVAL' },
    requesterComment: { type: DataTypes.TEXT },
    reviewerComment: { type: DataTypes.TEXT },
    createdAt: DataTypes.DATE,
    reviewedDate: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize: db,
    tableName: 'hr_document_deletion_requests',
    timestamps: true,
    updatedAt: 'reviewedDate',
    indexes: [
      { fields: ['document_or_folder_id'] },
      { fields: ['requested_by'] },
      { fields: ['reviewed_by'] },
      { fields: ['status'] },
      { fields: ['deletion_type'] },
    ],
  },
);

// Association with User for requester info
HRDocumentDeletionRequest.belongsTo(User, {
  foreignKey: 'requestedBy',
  as: 'requester',
  targetKey: 'id',
});

export default HRDocumentDeletionRequest;
