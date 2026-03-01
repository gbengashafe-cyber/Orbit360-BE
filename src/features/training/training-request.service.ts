import { v4 as uuidv4 } from 'uuid';
import { TrainingRequest, TrainingRequestStatus, RequestScope } from './training-request.model';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { sendEmail } from '../../utils/email'; // Assuming email service exists

export class TrainingRequestService {
  static async createRequest(data: any, requesterId: number) {
    try {
      // Validate required fields
      const requiredFields = [
        'trainingType',
        'trainingTitle',
        'trainingDescription',
        'priority',
        'businessJustification',
        'skillsToGain',
        'deliveryMethod',
        'preferredTimeframe',
        'estimatedDuration',
        'estimatedCost',
        'trainingProvider',
      ];

      for (const field of requiredFields) {
        if (!data[field]) {
          throw ApiError.badRequest(`${field} is required`);
        }
      }

      // Validate cost is a positive number
      if (isNaN(data.estimatedCost) || data.estimatedCost < 0) {
        throw ApiError.badRequest('Estimated cost must be a valid positive number');
      }

      // Validate team scope
      if (data.requestScope === RequestScope.TEAM) {
        if (!data.numberOfTeamMembers || data.numberOfTeamMembers <= 0) {
          throw ApiError.badRequest('Number of team members is required for team scope');
        }
        if (!Array.isArray(data.teamMemberIds) || data.teamMemberIds.length === 0) {
          throw ApiError.badRequest('Team member IDs are required for team scope');
        }
      }

      const request = await TrainingRequest.create({
        id: uuidv4(),
        requesterId,
        trainingType: data.trainingType,
        trainingTitle: data.trainingTitle,
        trainingDescription: data.trainingDescription,
        priority: data.priority,
        businessJustification: data.businessJustification,
        skillsToGain: data.skillsToGain,
        deliveryMethod: data.deliveryMethod,
        preferredTimeframe: data.preferredTimeframe,
        estimatedDuration: data.estimatedDuration,
        estimatedCost: data.estimatedCost,
        trainingProvider: data.trainingProvider,
        requestScope: data.requestScope || RequestScope.SELF,
        numberOfTeamMembers: data.numberOfTeamMembers,
        teamMemberIds: data.teamMemberIds,
        status: TrainingRequestStatus.PENDING,
      });

      logger.info(`[createRequest] Training request created: ${request.id} by user ${requesterId}`);

      // Trigger email notifications
      await this.sendSubmissionNotifications(request, requesterId);

      return request;
    } catch (error) {
      logger.error(`Error creating training request: ${error}`);
      throw error;
    }
  }

  static async getRequests(userId: number, userRole: string, filters?: any) {
    try {
      let query: any = {};

      // Filter based on user role
      if (userRole === 'employee') {
        query.requesterId = userId;
      } else if (userRole === 'supervisor' || userRole === 'admin' || userRole === 'admin_officer') {
        // Supervisors and admins see all requests
        // No additional filter needed
      } else if (userRole === 'hr_officer' || userRole === 'hr_manager') {
        // HR can see all or filter by status
        if (filters?.status) {
          query.status = filters.status;
        }
      }

      const requests = await TrainingRequest.findAll({
        where: query,
        order: [['createdAt', 'DESC']],
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      });

      return requests;
    } catch (error) {
      logger.error(`Error fetching training requests: ${error}`);
      throw error;
    }
  }

  static async getRequestById(requestId: string) {
    try {
      const request = await TrainingRequest.findByPk(requestId);
      if (!request) {
        throw ApiError.notFound('Training request not found');
      }
      return request;
    } catch (error) {
      logger.error(`Error fetching training request: ${error}`);
      throw error;
    }
  }

  static async supervisorApproval(requestId: string, supervisorId: number, approved: boolean, rejectionReason?: string) {
    try {
      const request = await this.getRequestById(requestId);

      if (request.status !== TrainingRequestStatus.PENDING) {
        throw ApiError.badRequest(`Request cannot be approved in ${request.status} status`);
      }

      if (approved) {
        request.status = TrainingRequestStatus.SUPERVISOR_APPROVED;
        request.supervisorApprovedAt = new Date();
        request.supervisorApprovedBy = supervisorId;
        await request.save();

        logger.info(`[supervisorApproval] Request ${requestId} approved by supervisor ${supervisorId}`);
        await this.sendApprovalNotifications(request, 'supervisor_approved');
      } else {
        if (!rejectionReason || rejectionReason.trim() === '') {
          throw ApiError.badRequest('Rejection reason is required');
        }

        request.status = TrainingRequestStatus.SUPERVISOR_REJECTED;
        request.supervisorRejectionReason = rejectionReason;
        request.supervisorApprovedBy = supervisorId;
        await request.save();

        logger.info(
          `[supervisorApproval] Request ${requestId} rejected by supervisor ${supervisorId}. Reason: ${rejectionReason}`,
        );
        await this.sendRejectionNotifications(request, 'supervisor_rejected', rejectionReason);
      }

      return request;
    } catch (error) {
      logger.error(`Error in supervisor approval: ${error}`);
      throw error;
    }
  }

  static async hrApproval(requestId: string, hrOfficerId: number, approved: boolean, rejectionReason?: string) {
    try {
      const request = await this.getRequestById(requestId);

      // HR can approve from PENDING or SUPERVISOR_REJECTED
      const allowedStatuses = [TrainingRequestStatus.PENDING, TrainingRequestStatus.SUPERVISOR_REJECTED];
      if (!allowedStatuses.includes(request.status as TrainingRequestStatus)) {
        throw ApiError.badRequest(`Request cannot be reviewed in ${request.status} status`);
      }

      if (approved) {
        request.status = TrainingRequestStatus.HR_APPROVED;
        request.hrApprovedAt = new Date();
        request.hrApprovedBy = hrOfficerId;
        await request.save();

        logger.info(`[hrApproval] Request ${requestId} approved by HR Officer ${hrOfficerId}`);
        await this.sendApprovalNotifications(request, 'hr_approved');
      } else {
        if (!rejectionReason || rejectionReason.trim() === '') {
          throw ApiError.badRequest('Rejection reason is required');
        }

        request.status = TrainingRequestStatus.HR_REJECTED;
        request.hrRejectionReason = rejectionReason;
        request.hrApprovedBy = hrOfficerId;
        await request.save();

        logger.info(`[hrApproval] Request ${requestId} rejected by HR Officer ${hrOfficerId}. Reason: ${rejectionReason}`);
        await this.sendRejectionNotifications(request, 'hr_rejected', rejectionReason);
      }

      return request;
    } catch (error) {
      logger.error(`Error in HR approval: ${error}`);
      throw error;
    }
  }

  static async finalApproval(requestId: string, hrManagerId: number, approved: boolean, rejectionReason?: string) {
    try {
      const request = await this.getRequestById(requestId);

      if (request.status !== TrainingRequestStatus.HR_APPROVED) {
        throw ApiError.badRequest(`Request cannot be finalized from ${request.status} status`);
      }

      if (approved) {
        request.status = TrainingRequestStatus.FINAL_APPROVED;
        request.finalApprovedAt = new Date();
        request.finalApprovedBy = hrManagerId;
        await request.save();

        logger.info(`[finalApproval] Request ${requestId} final approved by HR Manager ${hrManagerId}`);
        await this.sendFinalApprovalNotification(request);
      } else {
        if (!rejectionReason || rejectionReason.trim() === '') {
          throw ApiError.badRequest('Rejection reason is required');
        }

        request.status = TrainingRequestStatus.FINAL_REJECTED;
        request.finalRejectionReason = rejectionReason;
        request.finalApprovedBy = hrManagerId;
        await request.save();

        logger.info(`[finalApproval] Request ${requestId} rejected by HR Manager ${hrManagerId}. Reason: ${rejectionReason}`);
        await this.sendFinalRejectionNotification(request, rejectionReason);
      }

      return request;
    } catch (error) {
      logger.error(`Error in final approval: ${error}`);
      throw error;
    }
  }

  static async deleteRequest(requestId: string, userId: number) {
    try {
      const request = await this.getRequestById(requestId);

      if (request.requesterId !== userId) {
        throw ApiError.forbidden('You can only delete your own requests');
      }

      if (request.status !== TrainingRequestStatus.PENDING) {
        throw ApiError.badRequest('Can only delete pending requests');
      }

      await request.destroy();

      logger.info(`[deleteRequest] Training request ${requestId} deleted by user ${userId}`);

      return { message: 'Request deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting training request: ${error}`);
      throw error;
    }
  }

  // Notification helpers
  private static async sendSubmissionNotifications(request: TrainingRequest, requesterId: number) {
    try {
      // TODO: Implement email service calls
      // 1. Send to supervisor
      // 2. Send to HR Officer
      // 3. Send to HR Manager
      logger.info(`[sendSubmissionNotifications] Notifications queued for request ${request.id}`);
    } catch (error) {
      logger.error(`Error sending submission notifications: ${error}`);
    }
  }

  private static async sendApprovalNotifications(request: TrainingRequest, stage: string) {
    try {
      // TODO: Implement email service calls based on stage
      logger.info(`[sendApprovalNotifications] Notifications queued for request ${request.id} at stage ${stage}`);
    } catch (error) {
      logger.error(`Error sending approval notifications: ${error}`);
    }
  }

  private static async sendRejectionNotifications(request: TrainingRequest, stage: string, reason: string) {
    try {
      // TODO: Implement email service calls
      logger.info(`[sendRejectionNotifications] Rejection notifications queued for request ${request.id} at stage ${stage}`);
    } catch (error) {
      logger.error(`Error sending rejection notifications: ${error}`);
    }
  }

  private static async sendFinalApprovalNotification(request: TrainingRequest) {
    try {
      // TODO: Send email to requester and team members
      logger.info(`[sendFinalApprovalNotification] Final approval notification queued for request ${request.id}`);
    } catch (error) {
      logger.error(`Error sending final approval notification: ${error}`);
    }
  }

  private static async sendFinalRejectionNotification(request: TrainingRequest, reason: string) {
    try {
      // TODO: Send email to requester
      logger.info(`[sendFinalRejectionNotification] Final rejection notification queued for request ${request.id}`);
    } catch (error) {
      logger.error(`Error sending final rejection notification: ${error}`);
    }
  }
}
