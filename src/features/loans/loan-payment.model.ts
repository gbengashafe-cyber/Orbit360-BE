import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { Payroll } from '../payroll/payroll.model';
import { Loan } from './loan.model';

export class LoanPayment extends Model<InferAttributes<LoanPayment>, InferCreationAttributes<LoanPayment>> {
  declare id: CreationOptional<number>;
  declare loanId: ForeignKey<Loan['id']>;
  declare employeeId: ForeignKey<Employee['id']>;
  declare payPeriod: ForeignKey<Payroll['payPeriod']>;
  declare amount: number;
  declare paymentDate: Date;
}

LoanPayment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.INTEGER,
      references: { model: Loan, key: 'id' },
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      references: { model: Employee, key: 'id' },
      allowNull: false,
    },
    payPeriod: {
      type: DataTypes.STRING(7),
      references: { model: Payroll, key: 'payPeriod' },
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: 'loan_payments',
  },
);

LoanPayment.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(LoanPayment, { foreignKey: 'employeeId', as: 'loanPayments' });
