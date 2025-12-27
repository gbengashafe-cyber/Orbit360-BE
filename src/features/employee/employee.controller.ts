import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { Company } from '../company/company.model';
import { Department } from '../department/department.model';
import { Employee } from './employee.model';
import { EmployeeRepository } from './employee.repository';
import { EmployeeCompensation } from './employeeCompensation.model';

export class EmployeeController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination!;
      const offset = (page - 1) * rows;

      const { count, rows: employees } = await Employee.findAndCountAll({
        attributes: { exclude: ['departmentName'] },
        limit: rows,
        offset,
        include: [{ model: Department, as: 'department', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
      });

      if (!count) {
        throw ApiError.notFound('No employee found');
      }

      res.json(
        ApiResponse({
          message: 'Employees fetched successfully',
          data: employees,
          pagination: {
            total: count,
            page,
            rows,
            pages: Math.ceil(count / rows),
          },
        }),
      );
    } catch (error) {
      logger.error(`Error fetching employees: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employee = await Employee.findByPk(id, {
        attributes: { exclude: ['departmentName'] },
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['name'],
            include: [{ model: Company, as: 'company', attributes: ['name', 'description'] }],
          },
          {
            model: EmployeeCompensation,
            as: 'compensation',
            attributes: { exclude: ['id', 'employeeId', 'createdAt', 'updatedAt'] },
          },
        ],
      });

      if (!employee) {
        throw ApiError.notFound('Employee not found');
      }

      res.json(ApiResponse({ data: employee, message: 'Employee fetched successfully' }));
    } catch (error) {
      logger.error(`Error fetching employee: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = req.body.validated.employee;

      const createdEmployee = await EmployeeRepository.create(employee);

      res.status(201).json(ApiResponse({ data: createdEmployee, message: 'Employee created successfully' }));
    } catch (error) {
      logger.error(`Error creating employee: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, hireDate, departmentId, positionId: position, status } = req.body;

      const employee = await EmployeeRepository.isExist(id);

      if (!employee) {
        throw ApiError.notFound('Employee not found');
      }

      await EmployeeRepository.update(id, req.body.validated.employee);

      const updatedEmployee = await EmployeeRepository.readById(id);

      res.json(ApiResponse({ data: updatedEmployee, message: 'Employee updated successfully' }));
    } catch (error) {
      logger.error(`Error updating employee: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const employee = await Employee.findByPk(id);
      if (!employee) {
        throw ApiError.notFound('Employee not found');
      }

      await employee.destroy();

      res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting employee: ${error}`);
      next(error);
    }
  }
}
