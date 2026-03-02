import { Request, Response, NextFunction } from 'express';
import { TrainingRequestService } from './training-request.service';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';

export class TrainingRequestController {
  static async submitRequest(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User ID is required');
    }

    const request = await TrainingRequestService.createRequest(req.body, userId);

    return res.status(201).json(
      ApiResponse({
        data: request,
        message: 'Training request submitted successfully. It is now pending supervisor approval.',
      }),
    );
  }

  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        throw new Error('User ID and role are required');
      }

      const filters = {
        status: req.query.status,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const requests = await TrainingRequestService.getRequests(userId, userRole, filters);

      logger.info(`[getRequests] Fetched training requests for user ${userId}`);

      return res.json(
        ApiResponse({
          data: requests,
          message: 'Training requests fetched successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error fetching training requests: ${error}`);
      next(error);
    }
  }

  static async getRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const request = await TrainingRequestService.getRequestById(id);

      logger.info(`[getRequestById] Fetched training request ${id}`);

      return res.json(
        ApiResponse({
          data: request,
          message: 'Training request fetched successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error fetching training request: ${error}`);
      next(error);
    }
  }

  static async supervisorApprove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approved, rejectionReason } = req.body;
      const supervisorId = req.user?.id;

      if (!supervisorId) {
        throw new Error('Supervisor ID is required');
      }

      const request = await TrainingRequestService.supervisorApproval(id, supervisorId, approved, rejectionReason);

      const message = approved
        ? 'Training request approved by supervisor. Moving to HR review.'
        : `Training request rejected by supervisor. Reason: ${rejectionReason}`;

      logger.info(`[supervisorApprove] Request ${id} ${approved ? 'approved' : 'rejected'} by supervisor ${supervisorId}`);

      return res.json(
        ApiResponse({
          data: request,
          message,
        }),
      );
    } catch (error) {
      logger.error(`Error in supervisor approval: ${error}`);
      next(error);
    }
  }

  static async hrApprove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approved, rejectionReason } = req.body;
      const hrOfficerId = req.user?.id;

      if (!hrOfficerId) {
        throw new Error('HR Officer ID is required');
      }

      const request = await TrainingRequestService.hrApproval(id, hrOfficerId, approved, rejectionReason);

      const message = approved
        ? 'Training request approved by HR. Moving to final approval.'
        : `Training request rejected by HR. Reason: ${rejectionReason}`;

      logger.info(`[hrApprove] Request ${id} ${approved ? 'approved' : 'rejected'} by HR Officer ${hrOfficerId}`);

      return res.json(
        ApiResponse({
          data: request,
          message,
        }),
      );
    } catch (error) {
      logger.error(`Error in HR approval: ${error}`);
      next(error);
    }
  }

  static async finalApprove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approved, rejectionReason } = req.body;
      const hrManagerId = req.user?.id;

      if (!hrManagerId) {
        throw new Error('HR Manager ID is required');
      }

      const request = await TrainingRequestService.finalApproval(id, hrManagerId, approved, rejectionReason);

      const message = approved
        ? 'Training request approved. Employee will be notified.'
        : `Training request rejected. Reason: ${rejectionReason}`;

      logger.info(`[finalApprove] Request ${id} ${approved ? 'approved' : 'rejected'} by HR Manager ${hrManagerId}`);

      return res.json(
        ApiResponse({
          data: request,
          message,
        }),
      );
    } catch (error) {
      logger.error(`Error in final approval: ${error}`);
      next(error);
    }
  }

  static async deleteRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID is required');
      }

      const result = await TrainingRequestService.deleteRequest(id, userId);

      logger.info(`[deleteRequest] Training request ${id} deleted by user ${userId}`);

      return res.json(
        ApiResponse({
          data: result,
          message: 'Training request deleted successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error deleting training request: ${error}`);
      next(error);
    }
  }
}
