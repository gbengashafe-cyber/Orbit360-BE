import { CreationAttributes, Transaction, WhereOptions } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { ReadAllProps } from '../employee/employee.repository';
import { PayrollBatch } from './payroll-batch.model';
import { Payroll, payrollStatus } from './payroll.model';

export class PayrollRepository {
  static readonly create = (payroll: CreationAttributes<Payroll>, transaction: Transaction) => {
    return Payroll.create(payroll, { transaction });
  };

  static readonly bulkCreate = (payrollData: CreationAttributes<Payroll>[], transaction: Transaction) => {
    return Payroll.bulkCreate(payrollData, { transaction });
  };

  static readonly payPeriodExist = ({ companyId, payPeriod }: { payPeriod: string; companyId: number }) => {
    return PayrollBatch.findOne({ where: { payPeriod, companyId }, order: [['id', 'desc']] });
  };

  static readonly readById = (id: string | number) => {
    return Payroll.findByPk(id);
  };

  static readonly readByPayPeriod = async ({
    rows,
    page,
    companyId,
    filters,
    orderBy = 'createdAt',
    orderDirection = 'ASC',
  }: ReadAllProps) => {
    const offset = (page - 1) * rows;

    const where: WhereOptions = {};

    if (filters.status) where.status = filters.status;
    if (filters.payPeriod) where.payPeriod = filters.payPeriod;
    where.companyId = companyId;

    const { count, rows: data } = await Payroll.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'staffId', 'firstName', 'lastName', 'email', 'departmentId', 'jobRoleId'],
        },
      ],
      limit: rows,
      offset,
      order: [[orderBy, orderDirection]],
    });

    const totals = (await Payroll.findOne({
      attributes: [
        [db.fn('SUM', db.col('gross_salary')), 'totalGrossPay'],
        [
          db.fn('SUM', db.literal('gross_salary - (pension_deduction + paye_deduction + nhf_deduction + loan_deduction)')),
          'totalNetPay',
        ],
      ],
      where,
      raw: true,
    })) as { totalGrossPay: number; totalNetPay: number } | null;

    return {
      count,
      rows: data,
      totalGrossPay: totals?.totalGrossPay || 0,
      totalNetPay: totals?.totalNetPay || 0,
    };
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

  static readonly deleteByPayPeriod = (
    { payPeriod, companyId }: { payPeriod: string; companyId: number },
    transaction: Transaction,
  ) => {
    return Payroll.destroy({ where: { payPeriod, companyId }, transaction });
  };

  static readonly getByEmployee = async ({ employeeId, filters, rows, page }) => {
    const where: WhereOptions = { employeeId, status: 'APPROVED' };
    const offset = (page - 1) * rows;

    if (filters.payPeriod) {
      where.payPeriod = filters.payPeriod;
    }

    return Payroll.findAndCountAll({
      where,
      limit: rows,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] }],
    });
  };

  static readonly cancelBatch = async (id: number, transaction: Transaction) => {
    return PayrollBatch.update({ status: 'CANCELLED' }, { where: { id }, transaction });
  };
}
