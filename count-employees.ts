import { db } from './src/db';
import { Employee } from './src/features/employee/employee.model';

async function countEmployees() {
  try {
    const employees = await Employee.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'status'],
    });

    console.log(`Total employees: ${employees.length}`);
    employees.forEach(emp => {
      console.log(`  ID: ${emp.id}, Name: ${emp.firstName} ${emp.lastName}, Email: ${emp.email}, Status: ${emp.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

countEmployees();
