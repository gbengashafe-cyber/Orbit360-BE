import { CreationAttributes, InferAttributes, InferCreationAttributes, Op, Transaction } from 'sequelize';
import { Company } from '../company/company.model';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';
import { changeRequestStatus, EmployeeChangeRequest } from './employee-change-request.model';
import { employeeStatus } from './employee-schema';
import { Employee } from './employee.model';

export type ReadAllProps = {
  rows: number;
  page: number;
  companyId: number;
  filters: { [key: string]: any };
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};

export type ReadAllPropsWithNoCompany = Omit<ReadAllProps, 'companyId'>;

export class EmployeeRepository {
  private static readonly includes = [
    { model: JobRole, as: 'jobRole', attributes: ['id', 'title', 'description'] },
    { model: Department, as: 'department', attributes: ['id', 'name', 'description'] },
    { model: Company, as: 'company', attributes: ['id', 'name', 'description'] },
    { model: Employee, as: 'supervisor', attributes: ['id', 'firstName', 'lastName', 'staffId'], required: false },
  ];
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

  static readonly activeEmployeesCompensation = ({ rows, page, companyId }) => {
    const offset = (page - 1) * rows;

    return Employee.findAll({ where: { status: ['ACTIVE', 'ON_LEAVE'], companyId }, limit: rows, offset });
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
    if (filters.companyId) where.companyId = filters.companyId;

    if (filters.status && employeeStatus.includes(filters.status?.toUpperCase())) {
      where.status = filters.status;
    }

    if (filters.hireDateFrom || filters.hireDateTo) {
      where.hireDate = {
        ...(filters.hireDateFrom && { [Op.gte]: filters.hireDateFrom }),
        ...(filters.hireDateTo && { [Op.lte]: filters.hireDateTo }),
      };
    }

    return Employee.findAndCountAll({
      where,
      include: this.includes,
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });
  };

  static readonly readWithNoCompany = ({
    rows = 25,
    page = 1,
    filters,
    orderBy = 'createdAt',
    orderDirection = 'ASC',
  }: ReadAllPropsWithNoCompany) => {
    const offset = (page - 1) * rows;

    const where: any = {};

    if (filters.search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${filters.search}%` } },
        { lastName: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }
    if (filters.supervisorId) where.supervisorId = filters.supervisorId;
    if (filters.companyId) where.companyId = filters.companyId;

    if (filters.status && employeeStatus.includes(filters.status?.toUpperCase())) {
      where.status = filters.status;
    }

    if (filters.hireDateFrom || filters.hireDateTo) {
      where.hireDate = {
        ...(filters.hireDateFrom && { [Op.gte]: filters.hireDateFrom }),
        ...(filters.hireDateTo && { [Op.lte]: filters.hireDateTo }),
      };
    }

    return Employee.findAndCountAll({
      where,
      include: this.includes,
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });
  };
  static readonly readWithNoCompanyMini = ({
    rows = 25,
    page = 1,
    filters,
    orderBy = 'createdAt',
    orderDirection = 'ASC',
  }: ReadAllPropsWithNoCompany) => {
    const offset = (page - 1) * rows;

    const where: any = {};

    if (filters.search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${filters.search}%` } },
        { lastName: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }
    if (filters.companyId) where.companyId = filters.companyId;

    if (filters.supervisorId) where.supervisorId = filters.supervisorId;
    if (filters.status && employeeStatus.includes(filters.status?.toUpperCase())) {
      where.status = filters.status;
    }

    if (filters.hireDateFrom || filters.hireDateTo) {
      where.hireDate = {
        ...(filters.hireDateFrom && { [Op.gte]: filters.hireDateFrom }),
        ...(filters.hireDateTo && { [Op.lte]: filters.hireDateTo }),
      };
    }

    return Employee.findAndCountAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'staffId'],
      include: this.includes,
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });
  };

  static readonly readById = (id: string | number) => {
    return Employee.findByPk(id, {
      paranoid: false,
      include: [{ association: 'loans' }, ...this.includes],
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
  }: ReadAllPropsWithNoCompany) => {
    const where: any = { status: { [Op.notIn]: ['TERMINATED', 'PENDING_APPROVAL', 'CANCELLED'] } };

    if (filters.search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${filters.search}%` } },
        { lastName: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.supervisorId) where.supervisorId = filters.supervisorId;
    if (filters.companyId) where.companyId = filters.companyId;

    if (filters.hireDateFrom || filters.hireDateTo) {
      where.hireDate = {
        ...(filters.hireDateFrom && { [Op.gte]: filters.hireDateFrom }),
        ...(filters.hireDateTo && { [Op.lte]: filters.hireDateTo }),
      };
    }

    return Employee.findAndCountAll({
      where,
      include: [...this.includes, { association: 'supervisor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: rows,
      offset: (page - 1) * rows,
      order: [[orderBy, orderDirection]],
      nest: true,
    });
  };
}
