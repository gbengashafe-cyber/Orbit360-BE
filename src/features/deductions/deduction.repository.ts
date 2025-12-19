import { InferCreationAttributes, Op } from 'sequelize';
import { Deduction } from './deductions.model';

class DeductionRepository {
  static add = async (deduction: InferCreationAttributes<Deduction>) => {
    return Deduction.create(deduction);
  };

  static read = async ({ page, rows, query }) => {
    const whereCondition = query ? { name: { [Op.substring]: query } } : {};

    return Deduction.findAndCountAll({ where: whereCondition, limit: rows, offset: (page - 1) * rows });
  };

  static readById = async (id) => {
    return Deduction.findByPk(id);
  };

  static update = async (id, Deduction) => {
    return Deduction.update(Deduction, { where: { id } });
  };

  static delete = async (id) => {
    return Deduction.destroy({ where: { id } });
  };
}

export { DeductionRepository };
