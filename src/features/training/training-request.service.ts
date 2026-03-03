import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { EmployeeRepository } from '../employee/employee.repository';
import { TrainingRequest } from './training-request.model';
import { TrainingRequestSchema } from './training-request.validation';

export class TrainingRequestService {
  static async createRequest(data: any, employeeId: number) {
    const validatedPayload = TrainingRequestSchema.parse(data);

    const request = await TrainingRequest.create({
      ...validatedPayload,
      employeeId,
    });

    this.sendSubmissionNotifications(request, employeeId);

    return request;
  }

  static async getRequests({ employeeId, rows, page }) {
    const requests = await TrainingRequest.findAll({
      where: { employeeId },
      order: [['createdAt', 'DESC']],
      limit: rows,
      offset: (page - 1) * rows,
    });

    return requests;
  }

  static async getRequestById(requestId: string) {
    const request = await TrainingRequest.findByPk(requestId);
    if (!request) {
      throw ApiError.notFound('Training request not found');
    }
    return request;
  }

  static async supervisorApproval({
    requestId,
    supervisorId,
    supervisorEmployeeId,
    approved,
    supervisorNote,
  }: {
    requestId: string;
    supervisorId: number;
    supervisorEmployeeId: number;
    approved: boolean;
    supervisorNote?: string;
  }) {
    const request = await this.getRequestById(requestId);

    if (request.status !== 'PENDING_SUPERVISOR_APPROVAL') {
      throw ApiError.badRequest(`Request cannot be approved in ${request.status} status`);
    }

    const trainingInitiatorEmployeeRecord = await EmployeeRepository.readById(request.employeeId);

    if (trainingInitiatorEmployeeRecord?.supervisorId !== supervisorEmployeeId) {
      throw ApiError.forbidden('This request is pending supervisor approval OR HR review');
    }

    if (approved) {
      request.status = 'PENDING_HR_REVIEW';
      request.supervisorApprovedAt = new Date();
      request.supervisorApprovedBy = supervisorId;
      await request.save();

      this.sendApprovalNotifications(request, 'supervisor_approved');
    } else {
      if (!supervisorNote || supervisorNote.trim() === '') {
        throw ApiError.badRequest('Rejection reason is required');
      }

      request.status = 'SUPERVISOR_REJECTED';
      request.supervisorNote = supervisorNote;
      request.supervisorApprovedBy = supervisorId;
      await request.save();

      this.sendRejectionNotifications(request, 'supervisor_rejected', supervisorNote);
    }

    return request;
  }

  static async hrReview(requestId: string, hrOfficerId: number, approved: boolean, rejectionReason?: string) {
    const request = await this.getRequestById(requestId);

    if (!['PENDING_HR_REVIEW', 'PENDING_SUPERVISOR_APPROVAL'].includes(request.status)) {
      throw ApiError.badRequest(`Request cannot be reviewed in ${request.status} status`);
    }

    if (approved) {
      request.status = 'PENDING_HR_APPROVAL';
      request.hrReviewedAt = new Date();
      request.hrReviewedBy = hrOfficerId;
      await request.save();

      this.sendApprovalNotifications(request, 'PENDING_HR_APPROVAL');
    } else {
      if (!rejectionReason || rejectionReason.trim() === '') {
        throw ApiError.badRequest('Rejection reason is required');
      }

      request.status = 'HR_REJECTED';
      request.hrReviewerNote = rejectionReason;
      request.hrReviewedBy = hrOfficerId;
      await request.save();

      this.sendRejectionNotifications(request, 'hr_rejected', rejectionReason);
    }

    return request;
  }

  static async finalApproval(requestId: string, hrManagerId: number, approved: boolean, rejectionReason?: string) {
    const request = await this.getRequestById(requestId);

    if (request.status !== 'PENDING_HR_APPROVAL') {
      throw ApiError.badRequest(`Request cannot be finalized from ${request.status} status`);
    }

    if (approved) {
      request.status = 'FINAL_APPROVED';
      request.finalApprovedAt = new Date();
      request.finalApprovedBy = hrManagerId;
      await request.save();

      await this.sendFinalApprovalNotification(request);
    } else {
      if (!rejectionReason || rejectionReason.trim() === '') {
        throw ApiError.badRequest('Rejection reason is required');
      }

      request.status = 'FINAL_REJECTED';
      request.finalNote = rejectionReason;
      request.finalApprovedBy = hrManagerId;
      await request.save();

      this.sendFinalRejectionNotification(request, rejectionReason);
    }

    return request;
  }

  static async deleteRequest({ employeeId, requestId }: { employeeId: number; requestId: string }) {
    const request = await this.getRequestById(requestId);

    if (request.employeeId !== employeeId) {
      throw ApiError.forbidden('You can only delete your own requests');
    }

    if (request.status !== 'PENDING') {
      throw ApiError.badRequest('Can only delete pending requests');
    }

    return request.destroy();
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
