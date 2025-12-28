import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { User } from './user.model';

class UserRepository {
  static create = (user: InferCreationAttributes<User>) => {
    return User.create(user);
  };

  static read = async ({ page, rows, query }) => {
    const whereCondition = query ? { name: { [Op.substring]: query } } : {};

    return User.findAndCountAll({
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
      where: whereCondition,
      limit: rows,
      offset: (page - 1) * rows,
    });
  };

  static readById = async (id) => {
    return User.findByPk(id);
  };

  static update = async (id, role: InferAttributes<User>) => {
    return User.update(role, { where: { id } });
  };
}

export { UserRepository };
