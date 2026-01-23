import { CreationAttributes, Transaction } from 'sequelize';
import { ReadAllProps } from '../employee/employee.repository';
import { Payroll, payrollStatus } from './payroll.model';

export class PayrollRepository {
  static readonly create = (payroll: CreationAttributes<Payroll>, transaction: Transaction) => {
    return Payroll.create(payroll, { transaction });
  };

  static readonly bulkCreate = (payrollData: CreationAttributes<Payroll>[], transaction: Transaction) => {
    return Payroll.bulkCreate(payrollData, { transaction });
  };

  static readonly payPeriodExist = (payPeriod: string) => {
    return Payroll.findOne({ where: { payPeriod } });
  };

  static readonly readById = (id: string | number) => {
    return Payroll.findByPk(id);
  };

  static readonly read = ({ rows, page, filters, orderBy = 'createdAt', orderDirection = 'ASC' }: ReadAllProps) => {
    const offset = (page - 1) * rows;

    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.payPeriod) where.payPeriod = filters.payPeriod;

    return Payroll.findAndCountAll({
      where,
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });
  };

  static readonly updateByPayPeriod = (
    payPeriod: string,
    payroll: { status: (typeof payrollStatus)[number] },
    transaction: Transaction,
  ) => {
    return Payroll.update(payroll, { where: { payPeriod }, transaction });
  };

  static readonly deleteByPayPeriod = (payPeriod: string, transaction: Transaction) => {
    return Payroll.destroy({ where: { payPeriod }, transaction });
  };
}
