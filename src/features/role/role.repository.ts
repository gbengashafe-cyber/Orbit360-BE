import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { Role } from './role.model';

class RoleRepository {
  static getRoleByName = async (name: string) => {
    return Role.findOne({ where: { name } });
  };

  static create = (role: InferCreationAttributes<Role>) => {
    return Role.create(role);
  };

  static read = async ({ page, rows, query }) => {
    const whereCondition = query ? { name: { [Op.substring]: query } } : {};

    return Role.findAndCountAll({ where: whereCondition, limit: rows, offset: (page - 1) * rows });
  };

  static readById = async (id) => {
    return Role.findByPk(id);
  };

  static update = async (id, role: InferAttributes<Role>) => {
    return Role.update(role, { where: { id } });
  };
}

export { RoleRepository };
