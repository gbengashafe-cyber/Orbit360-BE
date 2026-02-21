import { db } from '.';
import { Employee } from '../features/employee/employee.model';
import { LeaveBalanceService } from '../features/leave/leave-balance.service';
import { logger } from '../utils/logger';

async function seedLeaveBalances() {
  try {
    await db.authenticate();
    logger.info('Database connected');

    // Get all employees
    const employees = await Employee.findAll({ paranoid: false });
    logger.info(`Found ${employees.length} employees`);

    if (employees.length === 0) {
      logger.warn('No employees found in database');
      process.exit(1);
    }

    const currentYear = new Date().getFullYear();

    // Initialize leave balances for each employee
    for (const employee of employees) {
      try {
        await LeaveBalanceService.initializeLeaveBalances(employee.id, currentYear);
        logger.info(`Leave balances initialized for employee ${employee.id}`);
      } catch (error) {
        logger.error(`Error initializing leave balances for employee ${employee.id}: ${error}`);
      }
    }

    logger.info('✅ Leave balances seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding leave balances:', error);
    process.exit(1);
  }
}

seedLeaveBalances();
