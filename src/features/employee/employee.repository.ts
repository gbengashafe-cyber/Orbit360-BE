import { CreationAttributes, InferAttributes, InferCreationAttributes, Op, Transaction } from 'sequelize';
import { changeRequestStatus, EmployeeChangeRequest } from './employee-change-request.model';
import { Employee } from './employee.model';

export type ReadAllProps = {
  rows: number;
  page: number;
  filters: { [key: string]: any };
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};
export class EmployeeRepository {
  static readonly create = (employee: InferCreationAttributes<Employee>, transaction: Transaction) => {
    return Employee.create(employee, { transaction });
  };

  static readonly createModificationRequest = (
    changeRequest: CreationAttributes<EmployeeChangeRequest>,
    transaction: Transaction,
  ) => {
    return EmployeeChangeRequest.create(changeRequest, { transaction });
  };

  static readonly updateRequestStatus = async (
    id: number,
    status: (typeof changeRequestStatus)[number],
    checkerId: number,
    transaction?: any,
  ) => {
    return EmployeeChangeRequest.update({ status, reviewedBy: checkerId }, { where: { id }, transaction });
  };

  static readonly activeEmployeesCompensation = ({ rows, page }) => {
    const offset = (page - 1) * rows;

    return Employee.findAll({ where: { status: ['active', 'on_leave'] }, limit: rows, offset });
  };

  static readonly read = ({ rows = 25, page = 1, filters, orderBy = 'createdAt', orderDirection = 'ASC' }: ReadAllProps) => {
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

  static readonly readById = (id: string | number) => {
    return Employee.findByPk(id, {
      paranoid: false,
      include: [{ association: 'loans' }],
    });
  };

  static readonly update = (id: number | string, employee: InferAttributes<Employee>) => {
    return Employee.update(employee, { where: { id }, paranoid: false });
  };

  static readonly findActiveDirectory = async ({
    rows,
    page,
    filters,
    orderBy = 'createdAt',
    orderDirection = 'DESC',
  }: ReadAllProps) => {
    const where: any = { status: { [Op.notIn]: ['TERMINATED', 'PENDING_APPROVAL', 'CANCELLED'] } };

    if (filters.search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${filters.search}%` } },
        { lastName: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }

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
      offset: (page - 1) * rows,
      order: [[orderBy, orderDirection]],
      nest: true,
    });
  };
}
