import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { JobRole } from '../job-role/job-role.model';
import { JobRolePermissions } from '../permissions/permission.model';
import { User } from './user.model';

class UserRepository {
  static create = (user: InferCreationAttributes<User>) => {
    return User.create(user);
  };

  static readonly read = async ({ page, rows, filters }) => {
    const whereCondition: any = {};

    if (filters?.search) {
      whereCondition[Op.or] = [
        { firstName: { [Op.like]: `%${filters.search}%` } },
        { lastName: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }
    return User.findAndCountAll({
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
      where: whereCondition,
      limit: rows,
      offset: (page - 1) * rows,
    });
  };
  static readonly readJobRoles = async ({ page, rows, filters }) => {
    return JobRole.findAndCountAll({
      include: [{ model: JobRolePermissions }],
      limit: rows,
      offset: (page - 1) * rows,
    });
  };

  static readById = async (id) => {
    return User.findByPk(id);
  };
  static readonly readByEmail = async (email: string) => {
    return User.findOne({ attributes: ['id', 'email', 'first_name', 'profile_image', 'role'], where: { email } });
  };

  static update = async (id, role: InferAttributes<User>) => {
    return User.update(role, { where: { id } });
  };
}

export { UserRepository };
