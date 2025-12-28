import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Position } from '../position/position.model';

class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string>;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: 'name',
    },
    description: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    underscored: true,
    tableName: 'permissions',
  },
);

class PositionPermissions extends Model<InferAttributes<PositionPermissions>, InferCreationAttributes<PositionPermissions>> {
  declare id: CreationOptional<number>;
  declare position: ForeignKey<Position['title']>;
  declare permission: ForeignKey<Permission['name']>;
}

PositionPermissions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  { sequelize: db, underscored: true },
);

Permission.belongsToMany(Position, {
  through: PositionPermissions,
  sourceKey: 'name',
  foreignKey: 'permission',
  targetKey: 'title',
  otherKey: 'position',
});
Position.belongsToMany(Permission, {
  through: PositionPermissions,
  sourceKey: 'title',
  foreignKey: 'position',
  targetKey: 'name',
  otherKey: 'permission',
});

export { Permission, PositionPermissions };
