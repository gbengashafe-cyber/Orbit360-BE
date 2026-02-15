import { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { AuditLog } from '../../audit-log/audit-log.model';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { Employee } from '../employee/employee.model';
import { PayrollBatch } from './payroll-batch.model';
import { Payroll } from './payroll.model';
import { PayrollRepository } from './payroll.repository';
import { PayrollService } from './payroll.service';

export class PayrollController {
  currentPeriod = new Date(new Date().setDate(1));

  static readonly getPayrollBatchByPeriod = async (req: Request, res: Response) => {
    const payPeriod = req.params?.payPeriod;

    const batch = await PayrollRepository.payPeriodExist(payPeriod);

    res.json(ApiResponse({ data: batch ?? {} }));
  };

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

      const { count, rows: payrolls } = await PayrollRepository.getByEmployee({
        employeeId,
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

    try {
      if (!req.user?.id) {
        throw ApiError.badRequest('Maker ID is required.');
      }
      const result = await PayrollService.generateBatch(payPeriod, req.user.id, overwrite);

      res.status(201).json(ApiResponse({ data: { id: result.id }, message: 'Payroll generated successfully' }));
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

      res.status(201).json(ApiResponse({ data: createdPayroll, message: 'Payroll created successfully' }));
    } catch (error) {
      logger.error(`Error creating payroll: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { basicSalary } = req.body;

      const payroll = await Payroll.findByPk(id);

      if (!payroll) {
        throw ApiError.notFound('Payroll record not found');
      }

      await payroll.update({
        basicSalary,
      });

      const updatedPayroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.json(ApiResponse({ data: updatedPayroll, message: 'Payroll updated successfully' }));
    } catch (error) {
      logger.error(`Error updating payroll: ${error}`);
      next(error);
    }
  }

  static async markAsApproved(req: Request, res: Response) {
    const { batchId } = req.params;
    const checkerId = req.user?.id;

    const validationResult = approverNoteSchema.optional().parse(req.body);
    const approverNote = validationResult?.approverNote || '';

    if (!checkerId) {
      throw ApiError.forbidden('Checker ID is not provided');
    }

    const result = await PayrollService.approveBatch(batchId, checkerId, approverNote);
    res.json(ApiResponse({ data: result, message: 'Payroll marked as approved' }));
  }

  static async markAsRejected(req: Request, res: Response) {
    const { batchId } = req.params;

    const validationResult = approverNoteSchema.parse(req.body);
    const approverNote = validationResult.approverNote;

    const checkerId = req.user?.id;

    if (!checkerId) {
      throw ApiError.forbidden('Checker ID is not provided');
    }

    const result = await PayrollService.rejectBatch(batchId, checkerId, approverNote);
    res.json(ApiResponse({ data: { id: result }, message: 'Payroll marked as rejected' }));
  }

  static readonly queueForOverride = async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const payrollBatch = await PayrollBatch.findByPk(batchId);
    if (!payrollBatch) {
      throw ApiError.notFound('Payroll batch record not found');
    }

    db.transaction(async (t) => {
      await payrollBatch.update({ status: 'PENDING_OVERRIDE_APPROVAL' }, { transaction: t });

      const requesterId = req.user?.id as number;
      await AuditLog.create(
        { userId: requesterId, action: 'UPDATE', entity: 'Payroll', entityId: batchId, description: 'Sent payroll for override' },
        { transaction: t },
      );
    });

    res.json(ApiResponse({ data: {}, message: 'Payroll queued for override approval' }));
  };

  static readonly approveOverride = async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const payrollBatch = await PayrollBatch.findByPk(batchId);
    if (!payrollBatch) {
      throw ApiError.notFound('Payroll batch record not found');
    }

    db.transaction(async (t) => {
      await payrollBatch.update({ status: 'OVERRIDE_APPROVED' }, { transaction: t });

      const requesterId = req.user?.id as number;
      await AuditLog.create(
        { userId: requesterId, action: 'UPDATE', entity: 'Payroll', entityId: batchId, description: 'Approved payroll override' },
        { transaction: t },
      );
    });

    res.json(ApiResponse({ data: {}, message: 'Payroll override approved' }));
  };
}

const approverNoteSchema = z.object({ approverNote: z.string('Approver note should be a string of texts') });
