import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { PositionPermissions } from '../permissions/permission.model';
import { Position } from './position.model';

class PositionRepository {
  static getPermissionsByTitle = async (position: string) => {
    return PositionPermissions.findAll({ where: { position }, attributes: ['permission'] });
  };

  static create = (position: InferCreationAttributes<Position>) => {
    return Position.create(position);
  };

  static read = async ({ page, rows, query }) => {
    const whereCondition = query ? { name: { [Op.substring]: query } } : {};

    return Position.findAndCountAll({ where: whereCondition, limit: rows, offset: (page - 1) * rows });
  };

  static positionById = async (id) => {
    return Position.findByPk(id);
  };

  static update = async (id, role: InferAttributes<Position>) => {
    return Position.update(role, { where: { id } });
  };
}

export { PositionRepository };
