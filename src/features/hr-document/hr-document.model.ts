import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface HRDocumentAttributes {
  id?: string;
  name: string;
  file_url: string;
  document_type?: 'contract' | 'policy' | 'memo' | 'performance_review' | 'other';
  folder_id?: string;
  access_level?: 'private' | 'public';
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class HRDocument extends Model<HRDocumentAttributes> implements HRDocumentAttributes {
  public id!: string;
  public name!: string;
  public file_url!: string;
  public document_type!: 'contract' | 'policy' | 'memo' | 'performance_review' | 'other';
  public folder_id!: string;
  public access_level!: 'private' | 'public';
  public created_by!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

HRDocument.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    document_type: {
      type: DataTypes.ENUM('contract', 'policy', 'memo', 'performance_review', 'other'),
      defaultValue: 'other',
    },
    folder_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    access_level: {
      type: DataTypes.ENUM('private', 'public'),
      defaultValue: 'private',
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db,
    modelName: 'HRDocument',
    tableName: 'hr_documents',
    timestamps: true,
  },
);

export default HRDocument;
