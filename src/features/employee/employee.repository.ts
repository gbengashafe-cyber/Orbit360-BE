import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { Department } from '../department/department.model';
import { Employee } from './employee.model';
import { EmployeeCompensation } from './employeeCompensation.model';

export class EmployeeRepository {
  static create = (employee: InferCreationAttributes<Employee>) => {
    return Employee.create(employee, { include: [{ model: EmployeeCompensation, as: 'compensation' }] });
  };

  static isExist = (id: string | number) => {
    return Employee.findByPk(id, { paranoid: false });
  };

  static readById = (id: string | number) => {
    return Employee.findByPk(id, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
      paranoid: false,
    });
  };

  static update = (id: number | string, employee: InferAttributes<Employee>) => {
    return Employee.update(employee, { where: { id }, paranoid: false });
  };
}
