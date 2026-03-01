import { Request, Response, NextFunction } from 'express';
import { Complaint } from './complaint.model';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';

export class ComplaintController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, rows = 10 } = req.pagination || {};
      const offset = ((page as number) - 1) * (rows as number);
      const { status, severity, complaint_type, employee_id } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (severity) whereClause.severity = severity;
      if (complaint_type) whereClause.complaint_type = complaint_type;
      if (employee_id) whereClause.employee_id = employee_id;

      const { count, rows: complaints } = await Complaint.findAndCountAll({
        where: whereClause,
        limit: rows as number,
        offset,
        order: [['reported_date', 'DESC']],
      });

      res.json({
        data: complaints,
        pagination: { total: count, page, rows, pages: Math.ceil(count / (rows as number)) },
      });
    } catch (error) {
      logger.error(`Error fetching complaints: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const complaint = await Complaint.findByPk(id);

      if (!complaint) throw ApiError.notFound('Complaint not found');
      res.json({ data: complaint });
    } catch (error) {
      logger.error(`Error fetching complaint: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { employee_id, complaint_type, title, description, severity, reported_to } = req.body;

      const complaint = await Complaint.create({
        employee_id,
        complaint_type,
        title,
        description,
        severity: severity || 'medium',
        reported_date: new Date(),
        reported_to,
        status: 'open',
      });

      res.status(201).json({ data: complaint, message: 'Complaint created successfully' });
    } catch (error) {
      logger.error(`Error creating complaint: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const complaint = await Complaint.findByPk(id);

      if (!complaint) throw ApiError.notFound('Complaint not found');

      await complaint.update(req.body);
      res.json({ data: complaint, message: 'Complaint updated successfully' });
    } catch (error) {
      logger.error(`Error updating complaint: ${error}`);
      next(error);
    }
  }

  static async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { resolution_notes } = req.body;
      const complaint = await Complaint.findByPk(id);

      if (!complaint) throw ApiError.notFound('Complaint not found');

      await complaint.update({
        status: 'resolved',
        resolution_notes,
        resolved_date: new Date(),
      });

      res.json({ data: complaint, message: 'Complaint resolved successfully' });
    } catch (error) {
      logger.error(`Error resolving complaint: ${error}`);
      next(error);
    }
  }

  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const complaint = await Complaint.findByPk(id);

      if (!complaint) throw ApiError.notFound('Complaint not found');

      await complaint.update({ status: 'closed' });
      res.json({ data: complaint, message: 'Complaint closed successfully' });
    } catch (error) {
      logger.error(`Error closing complaint: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const complaint = await Complaint.findByPk(id);

      if (!complaint) throw ApiError.notFound('Complaint not found');

      await complaint.destroy();
      res.json({ message: 'Complaint deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting complaint: ${error}`);
      next(error);
    }
  }
}
