import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { PositionPermissions } from '../permissions/permission.model';
import { JobRole } from './job-role.model';

class PositionRepository {
  static getPermissionsByTitle = async (position: string) => {
    return PositionPermissions.findAll({ where: { position }, attributes: ['permission'] });
  };

  static create = (position: InferCreationAttributes<JobRole>) => {
    return JobRole.create(position);
  };

  static read = async ({ page, rows, query }) => {
    const whereCondition = query ? { name: { [Op.substring]: query } } : {};

    return JobRole.findAndCountAll({ where: whereCondition, limit: rows, offset: (page - 1) * rows });
  };

  static positionById = async (id) => {
    return JobRole.findByPk(id);
  };

  static update = async (id, role: InferAttributes<JobRole>) => {
    return JobRole.update(role, { where: { id } });
  };
}

export { PositionRepository };
