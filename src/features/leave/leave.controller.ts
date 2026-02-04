import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { Employee } from '../employee/employee.model';
import { LeaveBalance } from './leave-balance.model';
import { LeaveType } from './leave-type.model';
import { Leave } from './leave.model';
import { calculateWorkingDays, validateLeaveDates } from './leave.utils';

export class LeaveController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, startDate, endDate, type, reason } = req.body;

      // Validate leave dates
      const dateError = validateLeaveDates(startDate, endDate);
      if (dateError) {
        throw ApiError.badRequest(dateError);
      }

      // Calculate working days (excluding weekends)
      const workingDays = calculateWorkingDays(startDate, endDate);

      const leave = await Leave.create({
        employeeId,
        startDate,
        endDate,
        type,
        reason,
        status: 'pending',
        numberOfDays: workingDays,
      });

      const createdLeave = await Leave.findByPk(leave.id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      // Get leave balance for this employee and leave type
      const leaveBalance = await LeaveBalance.findOne({
        where: { employeeId, leaveType: type, year: new Date().getFullYear() },
      });

      res.status(201).json({
        data: createdLeave,
        message: 'Leave request created successfully',
        leaveInfo: {
          calculatedDays: workingDays,
          allocatedDays: leaveBalance?.totalDays || 0,
          remainingDays: leaveBalance ? leaveBalance.remainingDays - workingDays : 0,
        },
      });
    } catch (error) {
      logger.error(`Error creating leave: ${error}`);
      next(error);
    }
  }

  static async calculateLeaveDays(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, startDate, endDate, type } = req.body;

      // Validate leave dates
      const dateError = validateLeaveDates(startDate, endDate);
      if (dateError) {
        throw ApiError.badRequest(dateError);
      }

      // Calculate working days (excluding weekends)
      const workingDays = calculateWorkingDays(startDate, endDate);

      // Get leave balance for this employee and leave type
      const leaveBalance = await LeaveBalance.findOne({
        where: { employeeId, leaveType: type, year: new Date().getFullYear() },
      });

      res.json({
        message: 'Leave days calculated successfully',
        data: {
          calculatedDays: workingDays,
          allocatedDays: leaveBalance?.totalDays || 0,
          usedDays: leaveBalance?.usedDays || 0,
          remainingDays: leaveBalance ? leaveBalance.remainingDays - workingDays : 0,
          startDate,
          endDate,
          leaveType: type,
        },
      });
    } catch (error) {
      logger.error(`Error calculating leave days: ${error}`);
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: leaves } = await Leave.findAndCountAll({
        limit: rows,
        offset,
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: leaves,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching leaves: ${error}`);
      next(error);
    }
  }

  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: leaves } = await Leave.findAndCountAll({
        where: { employeeId },
        limit: rows,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: leaves,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching employee leaves: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const leave = await Leave.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      if (!leave) {
        throw ApiError.notFound('Leave request not found');
      }

      res.json({ data: leave });
    } catch (error) {
      logger.error(`Error fetching leave: ${error}`);
      next(error);
    }
  }

  static async getLeaveBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

      const balances = await LeaveBalance.findAll({
        where: { employeeId, year },
        order: [['leaveType', 'ASC']],
      });

      res.json({ data: balances });
    } catch (error) {
      logger.error(`Error fetching leave balance: ${error}`);
      next(error);
    }
  }

  static async getLeaveTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveTypes = await LeaveType.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']],
      });

      res.json({ data: leaveTypes });
    } catch (error) {
      logger.error(`Error fetching leave types: ${error}`);
      next(error);
    }
  }

  static async approveOrDecline(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action } = req.body;

      if (!['approved', 'rejected'].includes(action)) {
        throw ApiError.badRequest('Invalid action. Must be "approved" or "rejected"');
      }

      const leave = await Leave.findByPk(id);
      if (!leave) {
        throw ApiError.notFound('Leave request not found');
      }

      if (leave.status !== 'pending') {
        throw ApiError.badRequest('Leave request has already been processed');
      }

      await leave.update({ status: action });

      const updatedLeave = await Leave.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.json({ data: updatedLeave, message: `Leave request ${action}` });
    } catch (error) {
      logger.error(`Error updating leave status: ${error}`);
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const leave = await Leave.findByPk(id);
      if (!leave) {
        throw ApiError.notFound('Leave request not found');
      }

      if (leave.status === 'approved') {
        throw ApiError.badRequest('Cannot cancel an approved leave request');
      }

      await leave.destroy();

      res.json({ message: 'Leave request cancelled successfully' });
    } catch (error) {
      logger.error(`Error cancelling leave: ${error}`);
      next(error);
    }
  }
}
