import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { emailService } from '../../utils/email.service';
import { User } from '../users/user.model';
import { Exit } from './exit.model';

export class ExitController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const exitData = {
        ...req.body,
        status: req.body.status || 'submitted',
      };

      const exit = await Exit.create(exitData);

      // Send notification emails (non-blocking)
      setImmediate(async () => {
        try {
          // Get all HR admin users
          const hrAdmins = await User.findAll({
            where: { role: ['admin', 'admin_officer'] },
            attributes: ['email', 'firstName', 'lastName'],
          });

          const hrEmails = hrAdmins.map((admin) => admin.email);

          if (hrEmails.length > 0) {
            await emailService.sendExitSubmissionEmail(
              hrEmails,
              exitData.employeeName,
              new Date(exitData.lastWorkingDate).toLocaleDateString(),
            );
            logger.info(`Exit submission email sent to ${hrEmails.length} HR admin(s)`);
          } else {
            logger.warn('No HR admins found to send exit notification');
          }
        } catch (emailError) {
          logger.error(`Failed to send exit notification emails: ${emailError}`);
          // Don't block the response if email fails
        }
      });

      res.status(201).json({
        data: exit,
        message: 'Exit request created successfully',
      });
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
      const { page = 1, rows = 10 } = req.query;
      const pageNum = parseInt(String(page), 10) || 1;
      const rowNum = parseInt(String(rows), 10) || 10;
      const offset = (pageNum - 1) * rowNum;

      const { count, rows: exits } = await Exit.findAndCountAll({
        where: { employeeId },
        limit: rowNum,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: exits,
        pagination: {
          total: count,
          page: pageNum,
          rows: rowNum,
          pages: Math.ceil(count / rowNum),
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
      const exit = await Exit.findByPk(id);

      if (!exit) {
        throw ApiError.notFound('Exit request not found');
      }

      res.json({ data: exit });
    } catch (error) {
      logger.error(`Error fetching exit: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const exit = await Exit.findByPk(id);

      if (!exit) {
        throw ApiError.notFound('Exit request not found');
      }

      await exit.update(req.body);
      const updatedExit = await Exit.findByPk(id);

      res.json({
        data: updatedExit,
        message: 'Exit request updated successfully',
      });
    } catch (error) {
      logger.error(`Error updating exit: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const exit = await Exit.findByPk(id);

      if (!exit) {
        throw ApiError.notFound('Exit request not found');
      }

      await exit.destroy();

      res.json({
        data: { id },
        message: 'Exit request deleted successfully',
      });
    } catch (error) {
      logger.error(`Error deleting exit: ${error}`);
      next(error);
    }
  }

  static async approveExit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const exit = await Exit.findByPk(id);
      if (!exit) {
        throw ApiError.notFound('Exit request not found');
      }

      await exit.update({
        status: action === 'approved' ? 'approved' : 'rejected',
        finalApprovalStatus: action === 'approved' ? 'approved' : 'rejected',
        finalApprovalDate: new Date(),
        finalApprovalBy: String(req.user?.id || 'system'),
      });

      const updatedExit = await Exit.findByPk(id);

      // Send notification email to employee (non-blocking)
      setImmediate(async () => {
        try {
          if (updatedExit && action === 'approved' && updatedExit.employeeEmail) {
            await emailService.sendExitApprovalEmail(
              updatedExit.employeeEmail,
              updatedExit.employeeName,
              new Date(updatedExit.lastWorkingDate).toLocaleDateString(),
            );
            logger.info(`Exit approval email sent to ${updatedExit.employeeEmail}`);
          } else if (action === 'rejected' && updatedExit) {
            logger.info(`Exit rejected for employee ${updatedExit.employeeId}. Consider sending rejection email.`);
          }
        } catch (emailError) {
          logger.error(`Failed to send approval email: ${emailError}`);
          // Don't block the response if email fails
        }
      });

      res.json({
        data: updatedExit,
        message: `Exit request ${action}`,
      });
    } catch (error) {
      logger.error(`Error approving exit: ${error}`);
      next(error);
    }
  }
}
