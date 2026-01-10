import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { Employee } from './employee.model';

export type ReadAllProps = {
  rows: number;
  page: number;
  filters: { [key: string]: any };
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};
export class EmployeeRepository {
  static create = (employee: InferCreationAttributes<Employee>) => {
    return Employee.create(employee);
  };

  static activeEmployeesCompensation = ({ rows, page }) => {
    const offset = (page - 1) * rows;

    return Employee.findAll({ where: { status: ['active', 'on_leave'] }, limit: rows, offset });
  };

  static read = ({ rows, page, filters, orderBy = 'createdAt', orderDirection = 'ASC' }: ReadAllProps) => {
    const offset = (page - 1) * rows;

    const where: any = {};

    if (filters.search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${filters.search}%` } },
        { lastName: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.status) where.status = filters.status;
    if (filters.departmentName) where.departmentName = filters.departmentName;
    if (filters.position) where.position = filters.position;
    if (filters.gender) where.gender = filters.gender;
    if (filters.supervisorId) where.supervisorId = filters.supervisorId;

    if (filters.hireDateFrom || filters.hireDateTo) {
      where.hireDate = {
        ...(filters.hireDateFrom && { [Op.gte]: filters.hireDateFrom }),
        ...(filters.hireDateTo && { [Op.lte]: filters.hireDateTo }),
      };
    }

    return Employee.findAndCountAll({
      where,
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });
  };

  static isExist = (id: string | number) => {
    return Employee.findByPk(id, { paranoid: false });
  };

  static readonly readById = (id: string | number) => {
    return Employee.findByPk(id, {
      paranoid: false,
      include: [{ association: 'loans' }],
    });
  };

  static update = (id: number | string, employee: InferAttributes<Employee>) => {
    return Employee.update(employee, { where: { id }, paranoid: false });
  };
}
