import { db } from './src/db';
import { LeaveBalance } from './src/features/leave/leave-balance.model';
import { Employee } from './src/features/employee/employee.model';

async function check() {
  try {
    await db.authenticate();
    
    const employees = await Employee.findAll({ limit: 5 });
    console.log('Employees:', employees.map(e => ({ id: e.id, firstName: e.firstName, leaveEntitlement: e.leaveEntitlement })));
    
    if (employees.length > 0) {
      const balances = await LeaveBalance.findAll({ where: { employeeId: employees[0].id } });
      console.log(`\nLeave balances for employee ${employees[0].id}:`);
      console.log(JSON.stringify(balances.map(b => ({ leaveType: b.leaveType, totalDays: b.totalDays, usedDays: b.usedDays, remainingDays: b.remainingDays })), null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
