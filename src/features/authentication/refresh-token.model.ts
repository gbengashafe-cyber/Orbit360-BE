import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';

export class RefreshToken extends Model<InferAttributes<RefreshToken>, InferCreationAttributes<RefreshToken>> {
  declare id: CreationOptional<string>;
  declare userId: number;
  declare contextHash: string;
  declare parentId: CreationOptional<string>;
  declare issuedAt: CreationOptional<Date>;
  declare expiresAt: Date;
  declare revokedAt: CreationOptional<Date>;
  declare revokeReason: CreationOptional<string>;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },

    contextHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },

    parentId: {
      type: DataTypes.UUID,
    },

    issuedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    revokedAt: {
      type: DataTypes.DATE,
    },

    revokeReason: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize: db,
    timestamps: false,
    indexes: [{ fields: ['user_id'] }, { fields: ['parent_id'] }, { fields: ['expires_at'] }],
  },
);

RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });
