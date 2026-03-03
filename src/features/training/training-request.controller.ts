import { Request, Response } from 'express';
import z from 'zod';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { TrainingRequestService } from './training-request.service';

const trainingRequestReviewSchema = z
  .object({
    reviewerDecision: z.preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(['APPROVE', 'REJECT'], 'Invalid decision was provided'),
    ),
    hrReviewerNote: z.string().max(300),
  })
  .refine(
    ({ reviewerDecision, hrReviewerNote }) => {
      return !(reviewerDecision.toUpperCase() === 'REJECT' && hrReviewerNote.length < 2);
    },
    { message: 'Note is required if recommendation is `Reject`', path: ['hrReviewerNote'] },
  );

export class TrainingRequestController {
  static async submitRequest(req: Request, res: Response) {
    const employeeId = req.user?.employeeRecord?.id;

    if (!employeeId) {
      throw new Error('Employee ID is required');
    }

    const request = await TrainingRequestService.createRequest(req.body, employeeId);

    return res.status(201).json(
      ApiResponse({
        data: request,
        message: 'Training request submitted successfully. It is now pending supervisor approval.',
      }),
    );
  }

  static async getRequests(req: Request, res: Response) {
    const { page, rows } = req.pagination;

    const requests = await TrainingRequestService.getRequests({ page, rows });

    return res.json(
      ApiResponse({
        data: requests,
        message: 'Training requests fetched successfully',
      }),
    );
  }

  static async getRequestById(req: Request, res: Response) {
    const { id } = req.params;

    const request = await TrainingRequestService.getRequestById(id);

    return res.json(
      ApiResponse({
        data: request,
        message: 'Training request fetched successfully',
      }),
    );
  }

  static async supervisorApprove(req: Request, res: Response) {
    const { id } = req.params;
    const { approved, supervisorNote } = req.body;
    const supervisorId = req.user?.id;
    const supervisorEmployeeId = req.user?.employeeRecord?.id;

    if (!supervisorId || !supervisorEmployeeId) {
      throw ApiError.unauthenticated('Supervisor ID is required');
    }

    const request = await TrainingRequestService.supervisorApproval({
      requestId: id,
      supervisorEmployeeId,
      supervisorId,
      approved,
      supervisorNote,
    });

    const message = approved
      ? 'Training request approved by supervisor. Moving to HR review.'
      : `Training request rejected by supervisor`;

    return res.json(
      ApiResponse({
        data: request,
        message,
      }),
    );
  }

  static async hrReview(req: Request, res: Response) {
    const { id } = req.params;
    const { hrReviewerNote, reviewerDecision } = trainingRequestReviewSchema.parse(req.body);
    const hrOfficerId = req.user?.id;

    if (!hrOfficerId) {
      throw new Error('HR Officer ID is required');
    }

    const request = await TrainingRequestService.hrReview(id, hrOfficerId, reviewerDecision, hrReviewerNote);

    return res.json(
      ApiResponse({
        data: request,
        message: 'Training request reviewed by HR.',
      }),
    );
  }

  static async finalApprove(req: Request, res: Response) {
    const { id } = req.params;
    const { approved, finalNote } = req.body;
    const hrManagerId = req.user?.id;

    if (!hrManagerId) {
      throw new Error('HR Manager ID is required');
    }

    const request = await TrainingRequestService.finalApproval(id, hrManagerId, approved, finalNote);

    const message = approved
      ? 'Training request approved. Employee will be notified.'
      : `Training request rejected. Reason: ${finalNote}`;

    return res.json(
      ApiResponse({
        data: request,
        message,
      }),
    );
  }

  static async deleteRequest(req: Request, res: Response) {
    const { id } = req.params;
    const employeeId = req.user?.employeeRecord?.id;

    if (!employeeId) {
      throw ApiError.unauthenticated('employee ID not found');
    }

    await TrainingRequestService.deleteRequest({ employeeId, requestId: id });

    return res.json(
      ApiResponse({
        data: {},
        message: 'Training request deleted successfully',
      }),
    );
  }
}
