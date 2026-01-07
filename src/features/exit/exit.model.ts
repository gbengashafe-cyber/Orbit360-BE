import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface ExitAttributes {
  id?: number;
  employeeId: number;
  exitType: 'resignation' | 'termination' | 'retirement' | 'contract_end';
  exitDate: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: Date;
}

export class Exit extends Model<ExitAttributes> implements ExitAttributes {
  public id!: number;
  public employeeId!: number;
  public exitType!: 'resignation' | 'termination' | 'retirement' | 'contract_end';
  public exitDate!: Date;
  public reason!: string;
  public status!: 'pending' | 'approved' | 'rejected';
  public approvedBy!: number;
  public approvedAt!: Date;
}

Exit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exitType: {
      type: DataTypes.ENUM('resignation', 'termination', 'retirement', 'contract_end'),
      allowNull: false,
    },
    exitDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Exit',
    tableName: 'exits',
  },
);

Exit.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Exit, { foreignKey: 'employeeId', as: 'exits' });
