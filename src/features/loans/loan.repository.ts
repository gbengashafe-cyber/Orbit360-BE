import { CreationAttributes, Transaction } from 'sequelize';
import { LoanPayment } from './loan-payment.model';
import { Loan } from './loan.model';

export class LoanRepository {
  static readonly read = ({ rows, page }) => {
    const offset = (page - 1) * rows;

    return Loan.findAndCountAll({
      limit: rows,
      offset,
      include: [{ association: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
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

  static readonly create = (loan: CreationAttributes<Loan>) => {
    return Loan.create(loan);
  };

  static readonly createLoanPayment = (loanPayment: CreationAttributes<LoanPayment>[], transaction: Transaction) => {
    return LoanPayment.bulkCreate(loanPayment, { transaction });
  };

  static readonly update = (id: number, loan: Loan) => {
    return Loan.update(loan, { where: { id } });
  };

  static readonly delete = (id: number) => {
    return Loan.destroy({ where: { id } });
  };
  static readonly deleteRepaymentByPayPeriod = (payPeriod: string, transaction: Transaction) => {
    return LoanPayment.destroy({ where: { payPeriod }, transaction });
  };
}
