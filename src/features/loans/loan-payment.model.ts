import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { Loan } from './loan.model';
import { Company } from '../company/company.model';

export class LoanPayment extends Model<InferAttributes<LoanPayment>, InferCreationAttributes<LoanPayment>> {
  declare id: CreationOptional<number>;
  declare companyId: ForeignKey<Company['id']>;
  declare loanId: ForeignKey<Loan['id']>;
  declare employeeId: ForeignKey<Employee['id']>;
  declare payPeriod: string;
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
    companyId: { type: DataTypes.INTEGER, references: { model: Company, key: 'id' } },
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

LoanPayment.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(LoanPayment, { foreignKey: 'companyId' });
