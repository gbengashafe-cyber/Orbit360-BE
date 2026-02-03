import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { AuthUtil } from '../authentication/auth.utils';
import { PayrollRepository } from '../payroll/payroll.repository';
import { UserRepository } from '../users/user.repository';
import { EmployeeRepository } from './employee.repository';
import { EmployeeService } from './employee.service';
import { Transaction } from 'sequelize';
import { db } from '../../db';

export class EmployeeController {
  static async getAll(req: Request, res: Response) {
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
  }

  static async getUserEmployeeRecord(req: Request, res: Response) {
    const search = req.user?.email;

    if (!search) {
      throw ApiError.badRequest('User email address not provided');
    }
    const employee = await EmployeeRepository.read({ rows: 1, page: 1, filters: { search } });

    res.json(ApiResponse({ data: employee.rows[0], message: 'Employee fetched successfully' }));
  }

  static async getEmployeePayrollRecords(req: Request, res: Response) {
    const { id } = req.params;
    const { page, rows } = req.pagination;

    const { count, rows: payrolls } = await PayrollRepository.getByEmployee({
      employeeId: id,
      rows,
      page,
      filters: req.parsedQuery,
    });

    res.json(
      ApiResponse({
        data: payrolls,
        message: 'Payroll record(s) fetched successfully',
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      }),
    );
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

  static readonly createNewEmployee = async (req: Request, res: Response) => {
    const makerId = req.user?.id;
    const payload = req.body.validated.employee;

    if (!makerId) {
      throw ApiError.badRequest('Missing authentication. Kindly sign in and try again');
    }
    const result = await EmployeeService.submitNewEmployeeRequest(makerId, payload);

    return res.status(201).json({
      success: true,
      message: 'New employee request submitted for authorization.',
      data: { requestId: result.id },
    });
  };

  static readonly createEmployeeModRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    const makerId = req.user?.id;
    const payload = req.body.validated.employee;

    if (!id) {
      throw ApiError.badRequest('Missing employee identifier in request');
    }

    if (!makerId) {
      throw ApiError.badRequest('Missing authentication. Kindly sign in and try again');
    }

    const result = await EmployeeService.submitEmployeeChangeRequest(Number(id), makerId, payload);

    return res.status(201).json({
      success: true,
      message: 'Change request submitted for authorization.',
      data: { requestId: result.id },
    });
  };

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = req.body.validated.employee;

      const transaction = new Transaction(db, {});
      const createdEmployee = await EmployeeRepository.create(employee, transaction);

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

  static readonly getDirectory = async (req: Request, res: Response) => {
    const { page, rows } = req.pagination;

    const result = await EmployeeService.getDirectory({ page, rows, filters: req.parsedQuery });

    return res.json(
      ApiResponse({
        message: 'Active employee directory retrieved',
        ...result,
      }),
    );
  };
}
