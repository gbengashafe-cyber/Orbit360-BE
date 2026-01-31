import { Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response';
import { ApprovalService } from './pending-authorization.service';

export class ApprovalController {
  static readonly getDashboard = async (req: Request, res: Response) => {
    const { page, rows } = req.pagination;

    const result = await ApprovalService.getGroupedPending(page, rows);
    res.json(ApiResponse({ ...result, message: '' }));
  };

  static readonly getCounts = async (req: Request, res: Response) => {
    const data = await ApprovalService.getBadgeCounts();
    return res.json(ApiResponse({ data }));
  };
}
