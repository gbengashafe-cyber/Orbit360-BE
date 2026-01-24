import { NextFunction, Request, Response } from 'express';
import { CreationAttributes } from 'sequelize';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { Employee } from '../employee/employee.model';
import { EmployeeRepository } from '../employee/employee.repository';
import { LoanPayment } from '../loans/loan-payment.model';
import { LoanRepository } from '../loans/loan.repository';
import { Payroll } from './payroll.model';
import { PayrollRepository } from './payroll.repository';
import { calculatePayroll } from './payroll.utils';

export class PayrollController {
  currentPeriod = new Date(new Date().setDate(1));

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: payrolls } = await Payroll.findAndCountAll({
        limit: rows,
        offset,
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['createdAt', 'DESC']],
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
    } catch (error) {
      logger.error(`Error fetching payrolls: ${error}`);
      next(error);
    }
  }

  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: payrolls } = await Payroll.findAndCountAll({
        where: { employeeId },
        limit: rows,
        offset,
        order: [['createdAt', 'DESC']],
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
    } catch (error) {
      logger.error(`Error fetching employee payroll: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      if (!payroll) {
        throw ApiError.notFound('Payroll record not found');
      }

      res.json(ApiResponse({ data: payroll, message: 'Payroll record fetched successfully' }));
    } catch (error) {
      logger.error(`Error fetching payroll: ${error}`);
      next(error);
    }
  }

  static async getByPayPeriod(req: Request, res: Response) {
    const { payPeriod } = req.params;
    const { page, rows } = req.pagination;

    const {
      count,
      rows: payroll,
      totalGrossPay,
      totalNetPay,
    } = await PayrollRepository.readByPayPeriod({
      filters: { payPeriod },
      page,
      rows,
    });

    res.json(
      ApiResponse({
        data: payroll,
        message: 'Payroll record(s) fetched successfully',
        pagination: { total: count, page, pages: Math.ceil(count / rows), rows },
        meta: { totalGrossPay, totalNetPay },
      }),
    );
  }

  static readonly generatePayroll = async (req: Request, res: Response, next: NextFunction) => {
    const { payPeriod } = req.body.validated.payroll;
    const overwrite = req.parsedQuery?.overwrite === 'true';
    const CHUNK_SIZE = 500;

    try {
      const payPeriodExist = await PayrollRepository.payPeriodExist(payPeriod);

      if (payPeriodExist && !overwrite) {
        throw ApiError.badRequest('Payroll for this period already exists. Kindly use overwrite to regenerate.');
      }

      await db.transaction(async (transaction) => {
        if (payPeriodExist && overwrite) {
          await LoanRepository.deleteRepaymentByPayPeriod(payPeriod, transaction);
          await PayrollRepository.deleteByPayPeriod(payPeriod, transaction);
        }

        const pensionRate = 0.08;
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const activeEmployees = await EmployeeRepository.activeEmployeesCompensation({ rows: CHUNK_SIZE, page });

          if (!activeEmployees?.length) {
            break;
          }

          // Fetch all loans for this chunk at once to avoid N+1 performance issues
          const employeeIds = activeEmployees.map((e) => e.id);
          const allLoansForChunk = await LoanRepository.readEmployeesActiveLoans(employeeIds);

          const payrollData = [] as CreationAttributes<Payroll>[];
          const loanPaymentsData = [] as CreationAttributes<LoanPayment>[];

          for (const _employee of activeEmployees) {
            const employeeActiveLoans = allLoansForChunk.filter((l) => l.employeeId === _employee.id);

            const { payRoll, applicableLoansForPeriod } = calculatePayroll({
              employee: _employee,
              payPeriod,
              pensionRate,
              activeLoans: employeeActiveLoans,
            });

            // 1. Prepare Payroll record
            payrollData.push({
              ...payRoll,
              payPeriod,
              employeeId: _employee.id,
            });

            // 2. Prepare Loan Payment records with payPeriod instead of payrollId
            if (applicableLoansForPeriod.length > 0) {
              const mappedLoans = applicableLoansForPeriod.map((loan) => ({
                ...loan,
                payPeriod,
              }));
              loanPaymentsData.push(...mappedLoans);
            }
          }

          // 3. Batch insert both for maximum performance
          await PayrollRepository.bulkCreate(payrollData, transaction);

          if (loanPaymentsData.length > 0) {
            await LoanRepository.createLoanPayment(loanPaymentsData, transaction);
          }

          if (activeEmployees.length < CHUNK_SIZE) hasMore = false;
          page++;
        }
      });

      res.status(201).json(ApiResponse({ data: {}, message: 'Payroll generated successfully' }));
    } catch (error) {
      next(error);
    }
  };

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payroll = await Payroll.create(Object.assign(req.body.validated.payroll, { status: 'pending' }));

      const createdPayroll = await Payroll.findByPk(payroll.id, {
        include: [{ model: Employee, as: 'employee', attributes: ['employeeId', 'firstName', 'lastName', 'email'] }],
      });

      res.status(201).json({ data: createdPayroll, message: 'Payroll created successfully' });
    } catch (error) {
      logger.error(`Error creating payroll: ${error}`);
      next(error);
    }
  }

  static readonly updateStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { payroll: payrollPayload } = req.body.validated;

    const payroll = await PayrollRepository.readById(id);

    if (!payroll) {
      throw ApiError.notFound('Payroll record not found');
    }

    await payroll.update(payrollPayload);

    const updatedPayroll = await PayrollRepository.readById(id);

    res.json(ApiResponse({ data: updatedPayroll, message: 'Payroll updated successfully' }));
  };

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { basicSalary, allowances = 0, deductions = 0 } = req.body;

      const payroll = await Payroll.findByPk(id);

      if (!payroll) {
        throw ApiError.notFound('Payroll record not found');
      }

      // const netSalary = (basicSalary || payroll.basicSalary) + allowances - deductions;

      await payroll.update({
        basicSalary,
      });

      const updatedPayroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.json({ data: updatedPayroll, message: 'Payroll updated successfully' });
    } catch (error) {
      logger.error(`Error updating payroll: ${error}`);
      next(error);
    }
  }

  static async markProcessed(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const payroll = await Payroll.findByPk(id);

      if (!payroll) {
        throw ApiError.notFound('Payroll record not found');
      }

      await payroll.update({ status: 'processed' });

      const updatedPayroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.json({ data: updatedPayroll, message: 'Payroll marked as processed' });
    } catch (error) {
      logger.error(`Error processing payroll: ${error}`);
      next(error);
    }
  }

  static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const payroll = await Payroll.findByPk(id);
      if (!payroll) {
        throw ApiError.notFound('Payroll record not found');
      }

      await payroll.update({ status: 'paid' });

      const updatedPayroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.json({ data: updatedPayroll, message: 'Payroll marked as paid' });
    } catch (error) {
      logger.error(`Error marking payroll as paid: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const payroll = await Payroll.findByPk(id);
      if (!payroll) {
        throw ApiError.notFound('Payroll record not found');
      }

      await payroll.destroy();

      res.json({ message: 'Payroll deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting payroll: ${error}`);
      next(error);
    }
  }
}
