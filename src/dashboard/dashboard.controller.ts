import { startOfMonth, subMonths } from 'date-fns';
import { Request, Response } from 'express';
import z from 'zod';
import { ApiResponse } from '../utils/api-response';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  static readonly getStats = async (req: Request, res: Response) => {
    const dashboardQuerySchema = z.object({
      departmentId: z.coerce.number().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    });

    let { departmentId, startDate, endDate } = dashboardQuerySchema.parse(req.query || {});

    if (!startDate) {
      startDate = startOfMonth(subMonths(new Date(), 1));
    }

    if (!endDate) {
      endDate = new Date();
    }

    if (departmentId === 0) {
      departmentId = undefined;
    }

    const data = await DashboardService.getDashboard({ departmentId, startDate, endDate });

    return res.json(ApiResponse({ data }));
  };
}
