import { Attributes, CreationAttributes, fn, literal, Transaction, WhereOptions } from 'sequelize';
import { Employee } from '../employee/employee.model';
import { LoanPayment } from './loan-payment.model';
import { LoanType } from './loan-types/loan-types.model';
import { Loan } from './loan.model';

type ActiveLoanAggregate = {
  activeLoanSum: string | null;
  paidOffLoans: string | null;
  activeLoans: string | null;
};

export class LoanRepository {
  static readonly getDashboard = async () => {
    const result = (await Loan.findOne({
      attributes: [
        [fn('SUM', literal(`CASE WHEN status = 'active' THEN principal_amount ELSE 0 END`)), 'activeLoanSum'],
        [fn('COUNT', literal(`CASE WHEN status = 'paid_off' THEN id ELSE NULL END`)), 'paidOffLoans'],
        [fn('COUNT', literal(`CASE WHEN status = 'active' THEN id ELSE NULL END`)), 'activeLoans'],
      ],
      raw: true,
    })) as ActiveLoanAggregate | null;

    return {
      activeLoanSum: result?.activeLoanSum || null,
      activeLoans: result?.activeLoans,
      paidOffLoans: result?.paidOffLoans || null,
    };
  };

  static readonly read = ({ rows, page, filters }) => {
    const whereOptions: WhereOptions = filters ? filters : {};

    return Loan.findAndCountAll({
      where: whereOptions,
      limit: rows,
      offset: (page - 1) * rows,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email', 'staffId'] },
        { model: LoanType },
      ],
      order: [['createdAt', 'DESC']],
      raw: false,
    });
  };

  static readonly readById = (id: number | string) => {
    return Loan.findByPk(id, {
      include: [{ association: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });
  };

  static readonly readEmployeesActiveLoans = (employeeId: (number | string)[]) => {
    return Loan.findAll({ where: { employeeId, status: 'active' } });
  };

  static readonly create = (loan: CreationAttributes<Loan>, { transaction }: { transaction: Transaction }) => {
    return Loan.create(loan, { transaction });
  };

  static readonly createLoanPayment = (loanPayment: CreationAttributes<LoanPayment>[], transaction: Transaction) => {
    return LoanPayment.bulkCreate(loanPayment, { transaction });
  };

  static readonly update = (id: number, loan: Attributes<Loan>, { transaction }) => {
    return Loan.update(loan, { where: { id }, transaction });
  };

  static readonly delete = (id: number) => {
    return Loan.destroy({ where: { id } });
  };
  static readonly deleteRepaymentByPayPeriod = (payPeriod: string, transaction: Transaction) => {
    return LoanPayment.destroy({ where: { payPeriod }, transaction });
  };
}
