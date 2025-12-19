import { db } from ".";
import { Company } from "../features/company/company.model";
import { Role } from "../features/role/role.model";
import { Attendance, Department, Employee, Leave, Payroll, Position } from "../models";
import { logger } from "../utils/logger";

async function seed() {
  try {
    await db.sync({ alter: true });
    logger.info("Database synced");

    const companies = await Company.bulkCreate([{ name: "MFB", description: "Microfinance Bank", createdBy: "" }]);
    logger.info("Companies created");

    const roles = await Role.bulkCreate([{ name: "ADMIN", description: "System admin" }]);
    logger.info("Role created");

    // Create Departments
    const departments = await Department.bulkCreate([
      { name: "Engineering", description: "Software Development" },
      { name: "Human Resources", description: "HR Department" },
      { name: "Finance", description: "Finance Department" },
      { name: "Sales", description: "Sales Department" },
    ]);
    logger.info("Departments created");

    // Create Positions
    const positions = await Position.bulkCreate([
      { title: "Senior Developer", description: "Senior Software Developer" },
      { title: "Junior Developer", description: "Junior Software Developer" },
      { title: "HR Manager", description: "HR Manager" },
      { title: "Sales Manager", description: "Sales Manager" },
    ]);
    logger.info("Positions created");

    // Create Employees
    const employees = await Employee.bulkCreate([
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        hireDate: new Date("2023-01-15"),
        salary: 75000,
        departmentId: departments[0].id,
        positionId: positions[0].id,
        status: "active",
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1234567891",
        hireDate: new Date("2023-03-20"),
        salary: 65000,
        departmentId: departments[0].id,
        positionId: positions[1].id,
        status: "active",
      },
      {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        phone: "+1234567892",
        hireDate: new Date("2022-06-10"),
        salary: 60000,
        departmentId: departments[1].id,
        positionId: positions[2].id,
        status: "active",
      },
    ]);
    logger.info("Employees created");

    // Create Attendance Records
    const today = new Date();
    await Attendance.bulkCreate([
      {
        employeeId: employees[0].id,
        date: today,
        checkIn: new Date(),
        checkOut: new Date(new Date().getTime() + 8 * 60 * 60 * 1000),
        status: "present",
      },
      {
        employeeId: employees[1].id,
        date: today,
        checkIn: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
        status: "present",
      },
    ]);
    logger.info("Attendance records created");

    // Create Leave Requests
    await Leave.bulkCreate([
      {
        employeeId: employees[0].id,
        startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
        type: "vacation",
        status: "pending",
        reason: "Family vacation",
      },
    ]);
    logger.info("Leave requests created");

    // Create Payroll Records
    await Payroll.bulkCreate([
      {
        employeeId: employees[0].id,
        month: 1,
        year: 2024,
        baseSalary: 75000,
        allowances: 5000,
        deductions: 3000,
        netSalary: 77000,
        status: "processed",
      },
      {
        employeeId: employees[1].id,
        month: 1,
        year: 2024,
        baseSalary: 65000,
        allowances: 4000,
        deductions: 2500,
        netSalary: 66500,
        status: "paid",
      },
    ]);
    logger.info("Payroll records created");

    logger.info("Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
