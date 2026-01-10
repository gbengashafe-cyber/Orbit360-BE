import { addMonths, format } from 'date-fns';
import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';

export const loanStatus = ['pending_approval', 'pending_disbursement', 'active', 'paid_off', 'rejected'] as const;
export const loanType = ['THRIFT', 'SALARY_ADVANCE', 'PERSONAL'] as const;

export class Loan extends Model<InferAttributes<Loan>, InferCreationAttributes<Loan>> {
  declare id: CreationOptional<number>;
  declare employeeId: ForeignKey<Employee['id']>;
  declare loanType: (typeof loanType)[number];
  declare principalAmount: number;
  declare interestRate: number;
  declare tenureMonths: number;
  declare startDate: Date;
  declare endDate: CreationOptional<string>;
  declare createdBy: ForeignKey<User['id']>;
  declare approvedBy: ForeignKey<User['id']>;
  declare approvedDate: Date;
  declare notes: string;
  declare status: CreationOptional<(typeof loanStatus)[number]>;
}

Loan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      references: { model: Employee, key: 'id' },
      allowNull: false,
    },
    loanType: { type: DataTypes.ENUM, allowNull: false, values: loanType },
    principalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    tenureMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: 'id' },
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    approvedDate: {
      type: DataTypes.DATEONLY,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM,
      values: loanStatus,
      defaultValue: 'pending_approval',
    },

    endDate: {
      type: DataTypes.VIRTUAL,
      get() {
        const startDate = this.getDataValue('startDate');
        const tenureMonths = this.getDataValue('tenureMonths');

        if (startDate && tenureMonths) {
          const endDate = addMonths(new Date(startDate), tenureMonths);

          return format(endDate, 'yyyy-MM-dd');
        }
        return null;
      },
    },
  },
  {
    sequelize: db,
    tableName: 'loans',
    timestamps: true,
  },
);

Loan.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Loan, { foreignKey: 'employeeId', as: 'loans' });

Loan.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
User.hasMany(Loan, { foreignKey: 'approvedBy', as: 'approvedLoans' });

Loan.belongsTo(User, { foreignKey: 'createdBy', as: 'initiator' });
User.hasMany(Loan, { foreignKey: 'createdBy', as: 'initiatedLoans' });
