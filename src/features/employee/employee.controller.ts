import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { AuthUtil } from '../authentication/auth.utils';
import { UserRepository } from '../users/user.repository';
import { EmployeeRepository } from './employee.repository';

export class EmployeeController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination;

      const { count, rows: employees } = await EmployeeRepository.read({
        rows,
        page,
        filters: req.parsedQuery,
      });

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

  static async getUserEmployeeRecord(req: Request, res: Response) {
    const { search } = req.parsedQuery;

    if (!search) {
      throw ApiError.badRequest('User email address not provided');
    }
    const employee = await EmployeeRepository.read({ rows: 1, page: 1, filters: { search } });

    const isRecordOwner = req.user?.email === employee.rows?.[0]?.email;
    if (!employee || !isRecordOwner) {
      throw ApiError.notFound('Employee not found');
    }

    res.json(ApiResponse({ data: employee.rows[0], message: 'Employee fetched successfully' }));
  }
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employee = await EmployeeRepository.readById(id);

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

      if (employee.createUser) {
        const password = await AuthUtil.hashPassword(AuthUtil.generatePassword());
        await UserRepository.create({ ...employee, password });
      }

      res.status(201).json(ApiResponse({ data: createdEmployee, message: 'Employee created successfully' }));
    } catch (error) {
      logger.error(`Error creating employee: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      let employeePayload = req.body.validated.employee;

      const employeeExistingData = await EmployeeRepository.readById(id);

      if (!employeeExistingData) {
        throw ApiError.notFound('Employee not found');
      }

      const shouldUpdateTerminationDate =
        employeeExistingData.status?.toUpperCase() !== 'TERMINATED' && employeePayload?.status?.toUpperCase() === 'TERMINATED';

      if (shouldUpdateTerminationDate) {
        employeePayload = { ...employeePayload, terminationDate: new Date() };
      }

      await EmployeeRepository.update(id, employeePayload);

      const updatedEmployee = await EmployeeRepository.readById(id);

      res.json(ApiResponse({ data: updatedEmployee, message: 'Employee updated successfully' }));
    } catch (error) {
      logger.error(`Error updating employee: ${error}`);
      next(error);
    }
  }
}
