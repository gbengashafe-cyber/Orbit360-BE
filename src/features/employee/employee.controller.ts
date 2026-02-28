import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { PayrollRepository } from '../payroll/payroll.repository';
import { EmployeeRepository } from './employee.repository';
import { EmployeeService } from './employee.service';

export class EmployeeController {
  static async getAll(req: Request, res: Response) {
    const { page, rows } = req.pagination;

    const { count, rows: employees } = await EmployeeRepository.readWithNoCompany({
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
    const employee = await EmployeeRepository.readWithNoCompany({ rows: 1, page: 1, filters: { search } });

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

  static readonly createLoanRequest = async (req: Request, res: Response) => {
    const employeeId = req.user?.employeeRecord?.id;
    const userId = req.user?.id;
    const loan = req.body?.validated?.loan;

    if (!loan) {
      throw ApiError.badRequest('Invalid loan details provided');
    }

    const response = await EmployeeService.createLoanRequest({ employeeId: Number(employeeId), loan, userId: Number(userId) });

    res.status(201).json(ApiResponse({ message: 'Loan request initiated successfully', data: { id: response.id } }));
  };

  static readonly updateLoanRequest = async (req: Request, res: Response) => {
    const employeeId = req.user?.employeeRecord?.id;
    const userId = req.user?.id;
    const loan = req.body?.validated?.loan;
    const loanId = req.params?.loanId;

    if (!loan || !loanId) {
      throw ApiError.badRequest('Invalid loan details provided');
    }
    await EmployeeService.updateLoanRequest({
      employeeId: Number(employeeId),
      loan,
      userId: Number(userId),
      loanId: Number(loanId),
    });

    res.status(201).json(ApiResponse({ message: 'Loan request updated successfully', data: {} }));
  };

  static readonly cancelLoanRequest = async (req: Request, res: Response) => {
    const employeeId = req.user?.employeeRecord?.id;
    const loanId = req.params?.loanId;

    await EmployeeService.cancelLoanRequest({ employeeId: Number(employeeId), loanId: Number(loanId) });

    res.status(201).json(ApiResponse({ message: 'Loan request initiated successfully', data: {} }));
  };

  static async getLoanRecords(req: Request, res: Response) {
    const employeeId = req.user?.employeeRecord?.id;
    const { page, rows } = req.pagination;

    if (!employeeId) {
      throw ApiError.unauthenticated('There is no record found for the logged in email address');
    }

    const { count, rows: loans } = await EmployeeService.getLoans({
      employeeId: employeeId,
      rows,
      page,
    });

    res.json(
      ApiResponse({
        data: loans,
        message: 'Loan record(s) fetched successfully',
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

  static readonly createCreationRequest = async (req: Request, res: Response) => {
    const makerId = req.user?.id as number;
    const payload = req.body.validated.employee;

    const requestId = await EmployeeService.initiateEmployeeCreation(payload, makerId);

    return res.status(201).json(
      ApiResponse({
        message: 'New employee request submitted for authorization.',
        data: { requestId },
      }),
    );
  };

  static readonly createModificationRequest = async (req: Request, res: Response) => {
    const id = req.params?.id;
    const makerId = req.user?.id as number;
    const payload = req.body.validated.employee;

    const result = await EmployeeService.initiateEmployeeMaintenance({ employeeId: Number(id), makerId, payload });

    return res.status(201).json({
      success: true,
      message: 'Change request submitted for authorization.',
      data: { requestId: result.id },
    });
  };

  static readonly approve = async (req: Request, res: Response) => {
    const { id } = req.params;
    const checkerId = req.user?.id as number;
    const { reason } = req.body;

    await EmployeeService.approveMaintenance(Number(id), checkerId, reason);

    return res.status(200).json(
      ApiResponse({
        data: {},
        message: 'Employee modification approved and data updated successfully.',
      }),
    );
  };

  static readonly reject = async (req: Request, res: Response) => {
    const id = req.params?.id;
    const checkerId = req.user?.id as number;
    const { reason } = req.body;

    await EmployeeService.rejectMaintenance(Number(id), checkerId, reason);

    return res.status(200).json(
      ApiResponse({
        data: {},
        message: 'Employee modification rejected.',
      }),
    );
  };

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
