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

  static readAllActive = () => {
    return Deduction.findAll({ where: { status: true } });
  };

  static readById = async (id) => {
    return Deduction.findByPk(id);
  };

  static update = async (id, deduction) => {
    return Deduction.update(deduction, { where: { id } });
  };

  static delete = async (id) => {
    return Deduction.destroy({ where: { id } });
  };
}

export { DeductionRepository };
