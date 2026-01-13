import { Request, Response, NextFunction } from 'express';
import { JobApplication, JobPosting } from '../models';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';

export class JobApplicationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination!;
      const offset = (page - 1) * rows;
      const { status, job_posting_id } = req.query;

      const whereClause: any = {};
      if (status) {
        whereClause.status = status;
      }
      if (job_posting_id) {
        whereClause.job_posting_id = job_posting_id;
      }

      const { count, rows: applications } = await JobApplication.findAndCountAll({
        where: whereClause,
        limit: rows,
        offset,
        include: [
          {
            model: JobPosting,
            as: 'jobPosting',
            attributes: ['id', 'title', 'department'],
          },
        ],
        order: [['applied_date', 'DESC']],
      });

      res.json({
        data: applications,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching job applications: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await JobApplication.findByPk(id, {
        include: [
          {
            model: JobPosting,
            as: 'jobPosting',
            attributes: ['id', 'title', 'department'],
          },
        ],
      });

      if (!application) {
        throw ApiError.notFound('Job application not found');
      }

      res.json({ data: application });
    } catch (error) {
      logger.error(`Error fetching job application: ${error}`);
      next(error);
    }
  }

  static async getByJobPosting(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { jobPostingId } = req.params;
      const { page, rows } = req.pagination!;
      const offset = (page - 1) * rows;

      const { count, rows: applications } = await JobApplication.findAndCountAll({
        where: { job_posting_id: jobPostingId },
        limit: rows,
        offset,
        order: [['applied_date', 'DESC']],
      });

      res.json({
        data: applications,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching job applications: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        job_posting_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        resume_url,
        cover_letter,
      } = req.body;

      // Verify job posting exists
      const jobPosting = await JobPosting.findByPk(job_posting_id);
      if (!jobPosting) {
        throw ApiError.notFound('Job posting not found');
      }

      const application = await JobApplication.create({
        job_posting_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        resume_url,
        cover_letter,
        applied_date: new Date(),
        status: 'applied',
      });

      res.status(201).json({
        data: application,
        message: 'Job application submitted successfully',
      });
    } catch (error) {
      logger.error(`Error creating job application: ${error}`);
      next(error);
    }
  }

  static async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { status, interview_date, interview_notes, rating } = req.body;

      const application = await JobApplication.findByPk(id);
      if (!application) {
        throw ApiError.notFound('Job application not found');
      }

      await application.update({
        status,
        interview_date,
        interview_notes,
        rating,
      });

      res.json({
        data: application,
        message: 'Job application updated successfully',
      });
    } catch (error) {
      logger.error(`Error updating job application: ${error}`);
      next(error);
    }
  }

  static async scheduleInterview(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { interview_date, interview_notes } = req.body;

      const application = await JobApplication.findByPk(id);
      if (!application) {
        throw ApiError.notFound('Job application not found');
      }

      await application.update({
        status: 'interview_scheduled',
        interview_date,
        interview_notes,
      });

      res.json({
        data: application,
        message: 'Interview scheduled successfully',
      });
    } catch (error) {
      logger.error(`Error scheduling interview: ${error}`);
      next(error);
    }
  }

  static async sendOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const application = await JobApplication.findByPk(id);
      if (!application) {
        throw ApiError.notFound('Job application not found');
      }

      await application.update({ status: 'offered' });

      res.json({
        data: application,
        message: 'Offer sent successfully',
      });
    } catch (error) {
      logger.error(`Error sending offer: ${error}`);
      next(error);
    }
  }

  static async hire(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const application = await JobApplication.findByPk(id);
      if (!application) {
        throw ApiError.notFound('Job application not found');
      }

      await application.update({ status: 'hired' });

      res.json({
        data: application,
        message: 'Applicant hired successfully',
      });
    } catch (error) {
      logger.error(`Error hiring applicant: ${error}`);
      next(error);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const application = await JobApplication.findByPk(id);
      if (!application) {
        throw ApiError.notFound('Job application not found');
      }

      await application.update({ status: 'rejected' });

      res.json({
        data: application,
        message: 'Applicant rejected',
      });
    } catch (error) {
      logger.error(`Error rejecting applicant: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const application = await JobApplication.findByPk(id);
      if (!application) {
        throw ApiError.notFound('Job application not found');
      }

      await application.destroy();

      res.json({ message: 'Job application deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting job application: ${error}`);
      next(error);
    }
  }
}
