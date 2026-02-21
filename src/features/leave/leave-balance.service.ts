import { Transaction } from 'sequelize';
import { logger } from '../../utils/logger';
import { LeaveBalance } from './leave-balance.model';

// Default leave entitlements per year
const DEFAULT_LEAVE_ENTITLEMENTS: { [key: string]: number } = {
  annual: 15,
  sick: 5,
  maternity: 90,
  paternity: 5,
  compassionate: 5,
  study: 5,
  unpaid: 0,
};

export class LeaveBalanceService {
  /**
   * Initialize leave balances for a new employee
   * Should be called when an employee is created
   */
  static async initializeLeaveBalances(employeeId: number, year: number = new Date().getFullYear(), transaction?: Transaction) {
    try {
      const { Employee } = await import('../employee/employee.model');

      // Get the employee's leave entitlement if not provided
      const employee = await Employee.findByPk(employeeId, { transaction });
      const annualLeaveDays = employee?.leaveEntitlement || DEFAULT_LEAVE_ENTITLEMENTS.annual;

      const balances = Object.entries(DEFAULT_LEAVE_ENTITLEMENTS).map(([leaveType, totalDays]) => ({
        employeeId,
        leaveType,
        totalDays: leaveType === 'annual' ? annualLeaveDays : totalDays,
        usedDays: 0,
        remainingDays: leaveType === 'annual' ? annualLeaveDays : totalDays,
        year,
      }));

      await LeaveBalance.bulkCreate(balances, { transaction });
      logger.info(`Leave balances initialized for employee ${employeeId}`);
    } catch (error) {
      logger.error(`Error initializing leave balances for employee ${employeeId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get leave balances for an employee
   */
  static async getLeaveBalances(employeeId: number, year?: number) {
    const searchYear = year || new Date().getFullYear();
    return LeaveBalance.findAll({
      where: { employeeId, year: searchYear },
      order: [['leaveType', 'ASC']],
    });
  }

  /**
   * Update remaining days after a leave request is approved
   */
  static async updateUsedDays(employeeId: number, leaveType: string, daysUsed: number, year?: number, transaction?: Transaction) {
    const searchYear = year || new Date().getFullYear();
    const balance = await LeaveBalance.findOne({
      where: { employeeId, leaveType, year: searchYear },
      transaction,
    });

    if (!balance) {
      throw new Error(`Leave balance not found for employee ${employeeId} and type ${leaveType}`);
    }

    const newUsedDays = balance.usedDays + daysUsed;
    const newRemainingDays = balance.totalDays - newUsedDays;

    await balance.update({ usedDays: newUsedDays, remainingDays: newRemainingDays }, { transaction });
    return balance;
  }
}
