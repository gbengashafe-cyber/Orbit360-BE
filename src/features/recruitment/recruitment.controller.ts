import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { JobPosting } from './job-posting.model';
import { JobApplication } from './job-application.model';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';

// ============ Job Posting Controller ============
export class JobPostingController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, rows = 10 } = req.pagination || {};
      const offset = ((page as number) - 1) * (rows as number);
      const { status } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status;

      const { count, rows: postings } = await JobPosting.findAndCountAll({
        where: whereClause,
        limit: rows as number,
        offset,
        order: [['posted_date', 'DESC']],
      });

      res.json({
        data: postings,
        pagination: { total: count, page, rows, pages: Math.ceil(count / (rows as number)) },
      });
    } catch (error) {
      logger.error(`Error fetching job postings: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);

      if (!posting) throw ApiError.notFound('Job posting not found');
      res.json({ data: posting });
    } catch (error) {
      logger.error(`Error fetching job posting: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        title,
        description,
        department,
        location,
        employment_type,
        salary_range_min,
        salary_range_max,
        requirements,
        created_by,
      } = req.body;

      const posting = await JobPosting.create({
        title,
        description,
        department,
        location,
        employment_type,
        salary_range_min,
        salary_range_max,
        requirements,
        posted_date: new Date(),
        status: 'pending_approval',
        created_by,
      });

      res.status(201).json({ data: posting, message: 'Job posting created successfully' });
    } catch (error) {
      logger.error(`Error creating job posting: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound('Job posting not found');

      await posting.update(req.body);
      res.json({ data: posting, message: 'Job posting updated successfully' });
    } catch (error) {
      logger.error(`Error updating job posting: ${error}`);
      next(error);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound('Job posting not found');

      await posting.update({
        status: 'active',
        approved_by,
        approved_date: new Date(),
      });
      res.json({ data: posting, message: 'Job posting approved' });
    } catch (error) {
      logger.error(`Error approving job posting: ${error}`);
      next(error);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound('Job posting not found');

      await posting.update({ status: 'rejected' });
      res.json({ data: posting, message: 'Job posting rejected' });
    } catch (error) {
      logger.error(`Error rejecting job posting: ${error}`);
      next(error);
    }
  }

  static async closeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound('Job posting not found');

      await posting.update({ status: 'closed', closedDate: new Date() });
      res.json({ data: posting, message: 'Job role closed' });
    } catch (error) {
      logger.error(`Error closing job role: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound('Job posting not found');

      await posting.destroy();
      res.json({ message: 'Job posting deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting job posting: ${error}`);
      next(error);
    }
  }

  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Active Jobs count
      const activeJobs = await JobPosting.count({
        where: { status: 'active' },
      });

      // Total Applications count
      const totalApplications = await JobApplication.count();

      // Pending Interviews count
      const pendingInterviews = await JobApplication.count({
        where: { status: 'interview_scheduled' },
      });

      // Hire Rate calculation
      const hiredCount = await JobApplication.count({
        where: { status: 'hired' },
      });

      const hireRate = totalApplications > 0 ? Math.round((hiredCount / totalApplications) * 100) : 0;

      res.json({
        data: {
          activeJobs,
          totalApplications,
          pendingInterviews,
          hireRate,
          hiredCount,
        },
      });
    } catch (error) {
      logger.error(`Error fetching recruitment dashboard stats: ${error}`);
      next(error);
    }
  }
}

// ============ Job Application Controller ============
export class JobApplicationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, rows = 10 } = req.pagination || {};
      const offset = ((page as number) - 1) * (rows as number);
      const { status, job_posting_id } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (job_posting_id) whereClause.job_posting_id = job_posting_id;

      const { count, rows: applications } = await JobApplication.findAndCountAll({
        where: whereClause,
        limit: rows as number,
        offset,
        order: [['applied_date', 'DESC']],
      });

      res.json({
        data: applications,
        pagination: { total: count, page, rows, pages: Math.ceil(count / (rows as number)) },
      });
    } catch (error) {
      logger.error(`Error fetching job applications: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound('Job application not found');
      res.json({ data: application });
    } catch (error) {
      logger.error(`Error fetching job application: ${error}`);
      next(error);
    }
  }

  static async getByJobPosting(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobPostingId } = req.params;
      const { page = 1, rows = 10 } = req.pagination || {};
      const offset = ((page as number) - 1) * (rows as number);

      const { count, rows: applications } = await JobApplication.findAndCountAll({
        where: { job_posting_id: jobPostingId },
        limit: rows as number,
        offset,
        order: [['applied_date', 'DESC']],
      });

      res.json({
        data: applications,
        pagination: { total: count, page, rows, pages: Math.ceil(count / (rows as number)) },
      });
    } catch (error) {
      logger.error(`Error fetching job applications: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { job_posting_id, applicant_name, applicant_email, applicant_phone, resume_url, cover_letter } = req.body;

      const jobPosting = await JobPosting.findByPk(job_posting_id);
      if (!jobPosting) throw ApiError.notFound('Job posting not found');

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

      res.status(201).json({ data: application, message: 'Job application submitted successfully' });
    } catch (error) {
      logger.error(`Error creating job application: ${error}`);
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound('Job application not found');

      await application.update(req.body);
      res.json({ data: application, message: 'Job application updated successfully' });
    } catch (error) {
      logger.error(`Error updating job application: ${error}`);
      next(error);
    }
  }

  static async scheduleInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { interview_date, interview_notes } = req.body;
      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound('Job application not found');

      await application.update({ status: 'interview_scheduled', interview_date, interview_notes });
      res.json({ data: application, message: 'Interview scheduled successfully' });
    } catch (error) {
      logger.error(`Error scheduling interview: ${error}`);
      next(error);
    }
  }

  static async sendOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound('Job application not found');

      await application.update({ status: 'offered' });
      res.json({ data: application, message: 'Offer sent successfully' });
    } catch (error) {
      logger.error(`Error sending offer: ${error}`);
      next(error);
    }
  }

  static async hire(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound('Job application not found');

      await application.update({ status: 'hired' });
      res.json({ data: application, message: 'Applicant hired successfully' });
    } catch (error) {
      logger.error(`Error hiring applicant: ${error}`);
      next(error);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound('Job application not found');

      await application.update({ status: 'rejected' });
      res.json({ data: application, message: 'Applicant rejected' });
    } catch (error) {
      logger.error(`Error rejecting applicant: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound('Job application not found');

      await application.destroy();
      res.json({ message: 'Job application deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting job application: ${error}`);
      next(error);
    }
  }
}
