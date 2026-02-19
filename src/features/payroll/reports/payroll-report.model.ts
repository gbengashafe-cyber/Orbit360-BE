import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { configUtil } from '../../../config/config-util';
import { db } from '../../../db';
import { User } from '../../users/user.model';

export class PayrollReport extends Model<InferAttributes<PayrollReport>, InferCreationAttributes<PayrollReport>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare fileName: string;
  declare payPeriod: string;
  declare uploadedBy: ForeignKey<User['id']>;
  declare fileUrl: string;
}

PayrollReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payPeriod: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },

    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    fileUrl: {
      type: DataTypes.VIRTUAL,
      get() {
        const fileName = this.getDataValue('fileName');
        if (!fileName) return null;

        const BASE_URL = configUtil.payrollReportStorageServer();
        const STORAGE_PATH = configUtil.payrollReportStoragePath().replace('../', '');

        const encodedFileName = encodeURIComponent(fileName);
        return `${BASE_URL}/${STORAGE_PATH}/${encodedFileName}`;
      },
    },
  },
  {
    sequelize: db,
    tableName: 'payroll_reports',
    timestamps: true,
  },
);

PayrollReport.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(PayrollReport, { foreignKey: 'uploadedBy' });
