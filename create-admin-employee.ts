import { db } from './src/db';
import { Employee } from './src/features/employee/employee.model';
import { LeaveBalanceService } from './src/features/leave/leave-balance.service';

async function create() {
  try {
    await db.authenticate();
    
    // Check if admin employee already exists
    const existing = await Employee.findOne({ where: { email: 'o@o.com' } });
    if (existing) {
      console.log('Admin employee already exists:', existing.id);
      process.exit(0);
    }

    const employee = await Employee.create({
      staffId: 'ADMIN001',
      firstName: 'Zoe',
      lastName: 'Zebedee',
      email: 'o@o.com',
      phone: '+2341234567890',
      dob: new Date('1990-05-15'),
      gender: 'F',
      nationality: 'Nigerian',
      address: '123 Main Street',
      hireDate: new Date('2026-01-01'),
      status: 'active',
      departmentName: 'INFORMATION TECHNOLOGY',
      jobRole: 'SENIOR DEVELOPER',
      annualBasicSalary: 500000,
      annualHousingAllowance: 100000,
      annualTransportAllowance: 50000,
      annualLeaveAllowance: 30000,
      annualOtherAllowances: 20000,
      bankName: 'First Bank',
      bankCode: '011',
      accountNumber: '1234567890',
      accountName: 'Zoe Zebedee',
      beneficiaryName: 'Zoe Zebedee',
      beneficiaryRelationship: 'Self',
      beneficiaryPhone: '+2341234567890',
      nokName: 'Zoe Zebedee',
      nokRelationship: 'Self',
      nokPhone: '+2341234567890',
      nokAddress: '123 Main Street',
      leaveEntitlement: 20,
      nhfApplicable: true,
    });

    console.log('Admin employee created with ID:', employee.id);

    // Initialize leave balances
    await LeaveBalanceService.initializeLeaveBalances(employee.id, new Date().getFullYear(), undefined, 20);
    console.log('Leave balances initialized');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

create();
