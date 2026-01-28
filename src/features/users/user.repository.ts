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

  static readonly readById = (id: string | number) => {
    return User.findByPk(id, { raw: true, attributes: { exclude: ['password'] } });
  };
  static readonly readByEmail = async (email: string) => {
    return User.findOne({ attributes: ['id', 'email', 'first_name', 'profile_image', 'role'], where: { email } });
  };

  static readonly update = async (id, user: Partial<InferAttributes<User>>) => {
    return User.update(user, { where: { id } });
  };
}

export { UserRepository };
