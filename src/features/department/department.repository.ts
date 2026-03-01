import { Op } from 'sequelize';
import { Employee } from '../employee/employee.model';
import { ReadAllPropsWithNoCompany } from '../employee/employee.repository';
import { JobRole } from '../job-role/job-role.model';
import { Department } from './department.model';

export class DepartmentRepository {
  static readonly getEmployees = (
    id: number | string,
    { rows, page, filters, orderBy = 'createdAt', orderDirection = 'ASC' }: ReadAllPropsWithNoCompany,
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
    if (filters.gender) where.gender = filters.gender;
    if (filters.supervisorId) where.supervisorId = filters.supervisorId;

    if (filters.hireDateFrom || filters.hireDateTo) {
      where.hireDate = {
        ...(filters.hireDateFrom && { [Op.gte]: filters.hireDateFrom }),
        ...(filters.hireDateTo && { [Op.lte]: filters.hireDateTo }),
      };
    }

    return Department.findByPk(id, {
      include: [{ model: Employee, as: 'employees', where, attributes: ['id', 'firstName', 'lastName', 'staffId'] }],
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });
  };

  static readonly getJobRoles = (
    id: number | string,
    { rows, page, filters, orderBy = 'createdAt', orderDirection = 'DESC' }: ReadAllPropsWithNoCompany,
  ) => {
    const offset = (page - 1) * rows;

    const where: any = {};

    if (filters.title) where.title = filters.title;

    return Department.findByPk(id, {
      include: [{ model: JobRole, as: 'departmentJobRoles', where }],
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });
  };
}
