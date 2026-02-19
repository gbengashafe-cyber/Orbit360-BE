import { CreationAttributes, InferAttributes, Op, Transaction } from 'sequelize';
import { JobRole } from '../job-role/job-role.model';
import { JobRolePermissions } from '../permissions/permission.model';
import { User } from './user.model';

class UserRepository {
  static readonly create = (user: CreationAttributes<User>, transaction: Transaction) => {
    return User.create(user, { transaction });
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
  static readonly readJobRoles = async ({ page, rows }) => {
    return JobRole.findAndCountAll({
      include: [{ model: JobRolePermissions }],
      limit: rows,
      offset: (page - 1) * rows,
    });
  };

  static readonly readById = (id: string | number) => {
    return User.findByPk(id, { raw: true, attributes: { exclude: ['password'] }, include: [{ model: JobRole }] });
  };
  static readonly readByEmail = async (email: string) => {
    return User.findOne({ attributes: ['id', 'email', 'first_name', 'profile_image', 'role'], where: { email } });
  };

  static readonly update = async (id, user: Partial<InferAttributes<User>>, { transaction }) => {
    return User.update(user, { where: { id }, transaction });
  };
}

export { UserRepository };
