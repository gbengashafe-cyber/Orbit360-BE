import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { Role } from './role.m';

class RoleRepository {
  static readonly getRoleByName = async (name: string) => {
    return Role.findOne({ where: { name } });
  };

  static readonly create = (role: InferCreationAttributes<Role>) => {
    return Role.create(role);
  };

  static readonly read = async ({ page, rows, query }) => {
    const whereCondition = query ? { name: { [Op.substring]: query } } : {};

    return Role.findAndCountAll({ where: whereCondition, limit: rows, offset: (page - 1) * rows });
  };

  static readonly readById = async (id) => {
    return Role.findByPk(id);
  };

  static readonly update = async (id, role: InferAttributes<Role>) => {
    return Role.update(role, { where: { id } });
  };
}

export { RoleRepository };
