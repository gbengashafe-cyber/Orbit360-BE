import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Company } from '../company/company.model';
import { Employee } from '../employee/employee.model';
import { PayrollBatch } from './payroll-batch.model';

export const payrollStatus = ['PENDING_APPROVAL', 'APPROVED'] as const;

export class Payroll extends Model<InferAttributes<Payroll>, InferCreationAttributes<Payroll>> {
  declare id: CreationOptional<number>;
  declare companyId: ForeignKey<Company['id']>;
  declare batchId: ForeignKey<PayrollBatch['batchId']>;
  declare employeeId: ForeignKey<Employee['id']>;
  declare payPeriod: string;
  declare basicSalary: number;
  declare grossSalary: number;
  declare housingAllowance: number;
  declare transportAllowance: number;
  declare leaveAllowance: number;
  declare otherAllowance: number;
  declare pensionDeduction: number;
  declare nhfDeduction: number;
  declare rentRelief: number;
  declare loanDeduction: number;
  declare payeDeduction: number;
  declare status: CreationOptional<(typeof payrollStatus)[number]>;
  declare paymentDate: CreationOptional<Date>;

  // Virtual Fields
  declare totalDeductions: CreationOptional<number>;
  declare totalAllowances: CreationOptional<number>;
  declare netSalary: CreationOptional<number>;
}

Payroll.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    companyId: { type: DataTypes.INTEGER, references: { model: Company, key: 'id' } },
    batchId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: { model: PayrollBatch, key: 'batch_id' },
      onDelete: 'CASCADE',
    },
    payPeriod: { type: DataTypes.STRING(7), allowNull: false },
    employeeId: {
      type: DataTypes.INTEGER,
      references: { model: Employee, key: 'id' },
      allowNull: false,
    },

    grossSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    basicSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    housingAllowance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    transportAllowance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    leaveAllowance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    otherAllowance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    pensionDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    nhfDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    rentRelief: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    loanDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payeDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM,
      values: payrollStatus,
      defaultValue: 'PENDING_APPROVAL',
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
    },

    // VIRTUAL FIELDS
    totalDeductions: {
      type: DataTypes.VIRTUAL,
      get() {
        return ['pensionDeduction', 'payeDeduction', 'nhfDeduction', 'loanDeduction'].reduce(
          (sum, key) => sum + (Number(this.getDataValue(key as any)) || 0),
          0,
        );
      },
    },
    totalAllowances: {
      type: DataTypes.VIRTUAL,
      get() {
        return ['housingAllowance', 'transportAllowance', 'leaveAllowance', 'otherAllowance'].reduce(
          (sum, key) => sum + (Number(this.getDataValue(key as any)) || 0),
          0,
        );
      },
    },
    netSalary: {
      type: DataTypes.VIRTUAL,
      get() {
        return (Number(this.grossSalary) || 0) - Number(this.totalDeductions);
      },
    },
  },
  {
    sequelize: db,
    tableName: 'payrolls',
    indexes: [
      {
        unique: true,
        name: 'unique_employee_pay_period',
        fields: ['employee_id', 'pay_period'],
      },
      {
        name: 'company_idx',
        fields: ['company_id'],
      },
      {
        name: 'payroll_batch_id_idx',
        fields: ['batch_id'],
      },
      {
        name: 'payroll_status_idx',
        fields: ['status'],
      },
    ],
  },
);

Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });

Payroll.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Payroll, { foreignKey: 'companyId' });

Payroll.belongsTo(PayrollBatch, { foreignKey: 'batchId', targetKey: 'batchId' });
PayrollBatch.hasMany(Payroll, { foreignKey: 'batchId', sourceKey: 'batchId', as: 'items' });
