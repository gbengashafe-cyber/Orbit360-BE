import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface HRFolderAttributes {
  id?: string;
  name: string;
  parent_folder_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class HRFolder extends Model<HRFolderAttributes> implements HRFolderAttributes {
  public id!: string;
  public name!: string;
  public parent_folder_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

HRFolder.init(
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
    parent_folder_id: {
      type: DataTypes.UUID,
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
    modelName: 'HRFolder',
    tableName: 'hr_folders',
    timestamps: true,
  },
);

export default HRFolder;
