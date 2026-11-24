import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { ComplaintStatus } from './complaint.model';
import { ComplaintService } from './complaint.service';

const sessionUser = (req: Request) => req.user as { id: number; email: string; permissions?: string[] };

export class ComplaintController {
  static readonly create = async (req: Request, res: Response) => {
    const data = await ComplaintService.submit(sessionUser(req), req.validatedBody);
    res.status(201).json(ApiResponse({ data, message: 'Complaint submitted successfully' }));
  };

  static readonly getMine = async (req: Request, res: Response) => {
    const { page, rows } = req.pagination;
    const result = await ComplaintService.listOwn(sessionUser(req), { page, rows });
    res.json(ApiResponse({ ...result, message: 'Complaints fetched successfully' }));
  };

  static readonly getAll = async (req: Request, res: Response) => {
    const { page, rows } = req.pagination;
    const status = (req.query.status as ComplaintStatus) || undefined;
    const result = await ComplaintService.listForReviewers({ status }, { page, rows });
    res.json(ApiResponse({ ...result, message: 'Complaints fetched successfully' }));
  };

  static readonly getById = async (req: Request, res: Response) => {
    const data = await ComplaintService.getById(sessionUser(req), Number(req.params.id));
    res.json(ApiResponse({ data, message: 'Complaint fetched successfully' }));
  };

  static readonly review = async (req: Request, res: Response) => {
    const { decision, note } = req.validatedBody;
    const data = await ComplaintService.review(sessionUser(req), Number(req.params.id), { decision, note });
    res.json(
      ApiResponse({
        data,
        message: decision === 'APPROVE' ? 'Complaint sent for HR Manager authorization' : 'Complaint rejected',
      }),
    );
  };

  static readonly approve = async (req: Request, res: Response) => {
    const data = await ComplaintService.decide(sessionUser(req), Number(req.params.id), {
      decision: 'APPROVE',
      note: req.validatedBody?.note,
    });
    res.json(ApiResponse({ data, message: 'Complaint approved' }));
  };

  static readonly reject = async (req: Request, res: Response) => {
    const data = await ComplaintService.decide(sessionUser(req), Number(req.params.id), {
      decision: 'REJECT',
      note: req.validatedBody?.note,
    });
    res.json(ApiResponse({ data, message: 'Complaint rejected' }));
  };
}
