import { DataTypes } from 'sequelize';

export const EmployeeFields = {
  staffId: { type: DataTypes.STRING(10), allowNull: false },
  firstName: { type: DataTypes.STRING(50), allowNull: false },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    set(this: any, value: string) {
      this.setDataValue('lastName', value?.toUpperCase());
    },
  },
  email: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  dob: { type: DataTypes.DATEONLY, allowNull: false },
  gender: { type: DataTypes.ENUM('M', 'F') },
  nationality: { type: DataTypes.STRING(30) },
  address: { type: DataTypes.STRING(100) },
  hireDate: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.STRING(20), defaultValue: 'PENDING_APPROVAL' },
  terminationDate: { type: DataTypes.DATEONLY },
  supervisorId: { type: DataTypes.INTEGER, allowNull: true },
  annualBasicSalary: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
  annualHousingAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
  annualTransportAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
  annualLeaveAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
  annualOtherAllowances: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
  bankName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    set(this: any, value: string) {
      this.setDataValue('bankName', value?.toUpperCase());
    },
  },
  bankCode: { type: DataTypes.STRING(30), allowNull: false },
  accountNumber: { type: DataTypes.STRING(20), allowNull: false },
  accountName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    set(this: any, value: string) {
      this.setDataValue('accountName', value?.toUpperCase());
    },
  },
  beneficiaryName: { type: DataTypes.STRING(100) },
  beneficiaryRelationship: { type: DataTypes.STRING(50) },
  beneficiaryPhone: { type: DataTypes.STRING(50) },
  nokName: { type: DataTypes.STRING(100) },
  nokRelationship: { type: DataTypes.STRING(50) },
  nokPhone: { type: DataTypes.STRING(50) },
  nokAddress: { type: DataTypes.STRING(100) },
  leaveEntitlement: { type: DataTypes.INTEGER() },
  nhfApplicable: { type: DataTypes.BOOLEAN, allowNull: false },
  departmentName: { type: DataTypes.STRING(100), allowNull: false },
  jobRole: { type: DataTypes.STRING(100), allowNull: false },
};
