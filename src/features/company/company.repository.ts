import { InferCreationAttributes } from 'sequelize';
import { Company } from './company.model';
import { Department } from '../department/department.model';

class CompanyRepository {
  static readonly add = async (company: InferCreationAttributes<Company>) => {
    return Company.create(company);
  };

  static readonly read = ({ page, rows }) => {
    return Company.findAndCountAll({ limit: rows, offset: (page - 1) * rows });
  };

  static readonly readById = async (id) => {
    return Company.findByPk(id);
  };

  static readonly readDepartments = async (companyId: number) => {
    return Company.findByPk(companyId, { include: [{ model: Department, as: 'departments' }] });
  };

  static readonly update = async (id, company) => {
    return Company.update(company, { where: { id } });
  };

  static readonly delete = async (id) => {
    return Company.destroy({ where: { id } });
  };
}

export { CompanyRepository };
