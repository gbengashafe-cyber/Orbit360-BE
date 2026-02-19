import config from 'config';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { ApiError } from '../../../utils/api-error';
import { ApiResponse } from '../../../utils/api-response';
import { logger } from '../../../utils/logger';
import { PayrollReportRepository } from './payroll-report.repository';

const STORAGE_PATH = config.get<string>('payrollReport.storagePath');

export class PayrollReportController {
  static async create(req: Request, res: Response) {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }
    const payrollReportPayload = req.body.validated.payrollReport;

    const fullData = {
      ...payrollReportPayload,
      fileName: req.file.filename,
      uploadedBy: req.user?.id,
    };

    const report = await PayrollReportRepository.create(fullData);
    res.status(201).json(ApiResponse({ data: report.id, message: 'Payroll report uploaded successfully' }));
  }

  static async getAll(req: Request, res: Response) {
    const { page, rows } = req.pagination;
    const { count, rows: payrollReports } = await PayrollReportRepository.findAll({ rows, page });

    res.json(
      ApiResponse({
        data: payrollReports,
        message: 'Payroll report(s) fetched successfully',
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      }),
    );
  }

  static async delete(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const report = await PayrollReportRepository.findById(id);

    if (!report) {
      throw ApiError.notFound('Payroll report not found');
    }

    const filePath = path.join(STORAGE_PATH, report.fileName);

    await fs.unlink(filePath).catch((err) => {
      logger.error(`File deletion failed for RequestID: ${req.requestId}: File path is ${filePath}:`, err.message);
    });

    await PayrollReportRepository.delete(id);

    res.json(ApiResponse({ data: {}, message: 'Payroll report deleted successfully' }));
  }
}
