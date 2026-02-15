import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../db';
import { User } from '../features/users/user.model';

export const AuditAction = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] as const;
const models = [...Object.keys(db.models)] as const;

export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare action: (typeof AuditAction)[number];
  declare entity: (typeof models)[number];
  declare entityId: string | null;
  declare description: string;
  declare readonly createdAt: CreationOptional<Date>;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    action: {
      type: DataTypes.ENUM(...Object.values(AuditAction)),
      allowNull: false,
    },

    entity: {
      type: DataTypes.ENUM(...models),
      allowNull: false,
    },

    entityId: {
      type: DataTypes.STRING,
    },

    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    createdAt: DataTypes.DATEONLY,
  },
  {
    sequelize: db,
    tableName: 'audit_logs',
    modelName: 'auditLog',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['entity'] },
      { fields: ['entity_id'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] },
      { fields: ['entity', 'entity_id'] },
    ],
  },
);

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});
