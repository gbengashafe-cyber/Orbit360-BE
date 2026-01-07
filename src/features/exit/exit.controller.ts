import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { Employee } from '../employee/employee.model';
import { Exit } from './exit.model';

export class ExitController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, exitType, exitDate, reason } = req.body;

      const exit = await Exit.create({
        employeeId,
        exitType,
        exitDate,
        reason,
        status: 'pending',
      });

      const createdExit = await Exit.findByPk(exit.id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.status(201).json({ data: createdExit, message: 'Exit request created successfully' });
    } catch (error) {
      logger.error(`Error creating exit: ${error}`);
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: exits } = await Exit.findAndCountAll({
        limit: rows,
        offset,
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: exits,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching exits: ${error}`);
      next(error);
    }
  }

  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: exits } = await Exit.findAndCountAll({
        where: { employeeId },
        limit: rows,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: exits,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching employee exits: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const exit = await Exit.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      if (!exit) {
        throw ApiError.notFound('Exit request not found');
      }

      res.json({ data: exit });
    } catch (error) {
      logger.error(`Error fetching exit: ${error}`);
      next(error);
    }
  }

  static async approveExit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action } = req.body;

      if (!['approved', 'rejected'].includes(action)) {
        throw ApiError.badRequest('Invalid action. Must be "approved" or "rejected"');
      }

      const exit = await Exit.findByPk(id);
      if (!exit) {
        throw ApiError.notFound('Exit request not found');
      }

      if (exit.status !== 'pending') {
        throw ApiError.badRequest('Exit request has already been processed');
      }

      await exit.update({
        status: action,
        approvedBy: req.user?.id,
        approvedAt: new Date(),
      });

      const updatedExit = await Exit.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.json({ data: updatedExit, message: `Exit request ${action}` });
    } catch (error) {
      logger.error(`Error approving exit: ${error}`);
      next(error);
    }
  }
}
