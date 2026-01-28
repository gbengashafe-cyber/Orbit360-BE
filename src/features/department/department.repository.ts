import { Op } from 'sequelize';
import { Employee } from '../employee/employee.model';
import { Department } from './department.model';
import { ReadAllProps } from '../employee/employee.repository';

export class DepartmentRepository {
  static readonly getEmployees = (
    id: number | string,
    { rows, page, filters, orderBy = 'createdAt', orderDirection = 'ASC' }: ReadAllProps,
  ) => {
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

    return Department.findByPk(id, {
      include: [{ model: Employee, as: 'employees', where }],
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });
  };
}
