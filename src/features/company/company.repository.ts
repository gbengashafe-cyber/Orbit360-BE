import { InferCreationAttributes, Op } from "sequelize";
import { Company } from "./company.model";

class CompanyRepository {
  static add = async (company: InferCreationAttributes<Company>) => {
    return Company.create(company);
  };

  static read = async ({ page, rows, query }) => {
    const whereCondition = query ? { name: { [Op.substring]: query } } : {};

    return Company.findAndCountAll({ where: whereCondition, limit: rows, offset: (page - 1) * rows });
  };

  static readById = async (id) => {
    return Company.findByPk(id);
  };

  static delete = async (id: number) => {
    return Company.destroy({ where: { id } });
  };
}

export { CompanyRepository };
