import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { emailService } from '../../utils/email.service';
import { logger } from '../../utils/logger';
import { Employee } from '../employee/employee.model';
import { NotificationService } from '../notifications/notification.service';
import { User } from '../users/user.model';
import { Exit } from './exit.model';
import { exitIdParamSchema } from './exit.validators';

export class ExitController {
  private static readonly notifyTerminalTransition = async (
    exit: Exit,
    previousStatus: Exit['status'],
    previousFinalApprovalStatus: Exit['finalApprovalStatus'],
    actorUserId?: number,
  ) => {
    const statusChanged = previousStatus !== exit.status;
    const approvalChanged = previousFinalApprovalStatus !== exit.finalApprovalStatus;
    let eventType: 'EXIT_APPROVED' | 'EXIT_REJECTED' | 'EXIT_COMPLETED' | null = null;

    if (statusChanged && exit.status === 'completed') eventType = 'EXIT_COMPLETED';
    else if ((statusChanged && exit.status === 'approved') || (approvalChanged && exit.finalApprovalStatus === 'approved')) {
      eventType = 'EXIT_APPROVED';
    } else if ((statusChanged && exit.status === 'rejected') || (approvalChanged && exit.finalApprovalStatus === 'rejected')) {
      eventType = 'EXIT_REJECTED';
    }

    if (eventType) {
      await NotificationService.notify(eventType, {
        exitId: exit.id,
        requesterEmployeeId: exit.employeeId,
        lastWorkingDate: exit.lastWorkingDate,
        actorUserId,
      });
    }
  };

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const exitData = {
        ...req.body,
        status: req.body.status || 'submitted',
      };

      const exit = await Exit.create(exitData);

      if (exit.status === 'submitted') {
        await NotificationService.notify('EXIT_APPLIED', {
          exitId: exit.id,
          requesterEmployeeId: exit.employeeId,
          lastWorkingDate: exit.lastWorkingDate,
          actorUserId: req.user?.id,
        });
        await NotificationService.notify('EXIT_REVIEW', { recordId: exit.id, employeeId: exit.employeeId, userId: req.user?.id });
      }

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

      const previousStatus = exit.status;
      const previousFinalApprovalStatus = exit.finalApprovalStatus;
      await exit.update(req.body);
      await ExitController.notifyTerminalTransition(exit, previousStatus, previousFinalApprovalStatus, req.user?.id);
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

  static async approveExit(req: Request, res: Response) {
    const { id } = req.params;
    const { action } = req.body;

    const exit = await Exit.findByPk(id);
    if (!exit) {
      throw ApiError.notFound('Exit request not found');
    }

    const previousStatus = exit.status;
    const previousFinalApprovalStatus = exit.finalApprovalStatus;

    const decision = {
      status: action === 'approved' ? 'approved' : 'rejected',
      finalApprovalStatus: action === 'approved' ? 'approved' : 'rejected',
      finalApprovalDate: new Date(),
      finalApprovalBy: String(req.user?.id || 'system'),
    } as const;
    const [updated] = await Exit.update(decision, {
      where: { id: exit.id, status: previousStatus, finalApprovalStatus: previousFinalApprovalStatus },
    });
    if (!updated) throw ApiError.conflict('Exit decision already changed.');
    exit.set(decision);
    await ExitController.notifyTerminalTransition(exit, previousStatus, previousFinalApprovalStatus, req.user?.id);

    const updatedExit = await Exit.findByPk(id, { include: [{ model: Employee, as: 'employee' }] });

    // Send notification email to employee (non-blocking)
    setImmediate(async () => {
      try {
        if (updatedExit && action === 'approved' && updatedExit?.employee?.email) {
          await emailService.sendExitApprovalEmail(
            updatedExit?.employee?.email,
            updatedExit?.employee?.firstName,
            new Date(updatedExit.lastWorkingDate).toLocaleDateString(),
          );
          logger.info(`Exit approval email sent to ${updatedExit?.employee?.email}`);
        } else if (action === 'rejected' && updatedExit) {
          logger.info(`Exit rejected for employee ${updatedExit.employeeId}. Consider sending rejection email.`);
        }
      } catch (emailError) {
        logger.error(`Failed to send approval email: ${emailError}`);
        // Don't block the response if email fails
      }
    });

    res.json(
      ApiResponse({
        data: updatedExit,
        message: `Exit request ${action}`,
      }),
    );
  }

  static async reviewExit(req: Request, res: Response) {
    const { action } = req.body;

    const { id } = exitIdParamSchema.parse(req.params);

    const exit = await Exit.findByPk(id);
    if (!exit) {
      throw ApiError.notFound('Exit request not found');
    }

    const previousStatus = exit.status;
    const previousFinalApprovalStatus = exit.finalApprovalStatus;

    const changes = {
      finalApprovalStatus: action === 'approved' ? 'cleared' : 'rejected',
      reviewerDate: new Date(),
      reviewerId: req.user?.id,
    } as const;
    const [updated] = await Exit.update(changes, { where: { id, finalApprovalStatus: 'pending', status: previousStatus } });
    if (updated !== 1) throw ApiError.conflict('Exit review already processed.');
    exit.set(changes);
    if (action === 'approved')
      await NotificationService.notify('EXIT_AUTHORIZATION', {
        recordId: exit.id,
        employeeId: exit.employeeId,
        userId: req.user?.id,
      });
    await ExitController.notifyTerminalTransition(exit, previousStatus, previousFinalApprovalStatus, req.user?.id);

    const updatedExit = await Exit.findByPk(id, { include: [{ model: Employee, as: 'employee' }] });

    res.json(
      ApiResponse({
        data: updatedExit,
        message: `Exit request ${action}`,
      }),
    );
  }
}
