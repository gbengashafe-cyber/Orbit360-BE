import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { Employee } from './employee.model';
import { EmployeeRepository } from './employee.repository';

export class EmployeeController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination!;

      const { count, rows: employees } = await EmployeeRepository.read({
        rows,
        page,
        filters: req.parsedQuery,
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
      const employee = await Employee.findByPk(id, {});

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
}
