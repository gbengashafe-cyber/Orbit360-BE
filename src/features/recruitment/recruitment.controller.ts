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

      if (!posting) throw ApiError.notFound(`Job posting with ID ${id} not found`);
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

      if (!title) throw ApiError.badRequest('Job title is required');
      if (!description) throw ApiError.badRequest('Job description is required');
      if (!department) throw ApiError.badRequest('Department is required');
      if (!location) throw ApiError.badRequest('Location is required');
      if (!created_by) throw ApiError.badRequest('Created by (user ID) is required');

      const posting = await JobPosting.create({
        title,
        description,
        department,
        location,
        employment_type: employment_type || 'full_time',
        salary_range_min,
        salary_range_max,
        requirements,
        posted_date: new Date(),
        status: 'pending_approval',
        created_by,
      });

      res.status(201).json({ data: posting, message: `Job posting '${title}' created successfully and is pending approval` });
    } catch (error) {
      logger.error(`Error creating job posting: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound(`Job posting with ID ${id} not found`);

      if (posting.status === 'closed') {
        throw ApiError.badRequest('Cannot update a closed job posting');
      }

      const oldTitle = posting.title;
      await posting.update(req.body);
      res.json({
        data: posting,
        message: `Job posting '${oldTitle}' updated successfully`,
      });
    } catch (error) {
      logger.error(`Error updating job posting: ${error}`);
      next(error);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      if (!approved_by) throw ApiError.badRequest('Approver ID is required');

      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound(`Job posting with ID ${id} not found`);

      if (posting.status !== 'pending_approval') {
        throw ApiError.badRequest(`Job posting cannot be approved when status is '${posting.status}'`);
      }

      await posting.update({
        status: 'active',
        approved_by,
        approved_date: new Date(),
      });
      res.json({
        data: posting,
        message: `Job posting '${posting.title}' approved and is now active`,
      });
    } catch (error) {
      logger.error(`Error approving job posting: ${error}`);
      next(error);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound(`Job posting with ID ${id} not found`);

      if (posting.status === 'active' || posting.status === 'closed') {
        throw ApiError.badRequest(`Cannot reject job posting with status '${posting.status}'`);
      }

      await posting.update({ status: 'rejected' });
      res.json({
        data: posting,
        message: `Job posting '${posting.title}' rejected successfully`,
      });
    } catch (error) {
      logger.error(`Error rejecting job posting: ${error}`);
      next(error);
    }
  }

  static async closeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound(`Job posting with ID ${id} not found`);

      if (posting.status !== 'active') {
        throw ApiError.badRequest(`Only active job postings can be closed. Current status: '${posting.status}'`);
      }

      await posting.update({ status: 'closed', closedDate: new Date() });
      res.json({
        data: posting,
        message: `Job posting '${posting.title}' closed successfully`,
      });
    } catch (error) {
      logger.error(`Error closing job role: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id);
      if (!posting) throw ApiError.notFound(`Job posting with ID ${id} not found`);

      if (posting.status === 'active' || posting.status === 'closed') {
        throw ApiError.badRequest(`Cannot delete job posting with status '${posting.status}'`);
      }

      const postingTitle = posting.title;
      await posting.destroy();
      res.json({
        message: `Job posting '${postingTitle}' deleted successfully`,
      });
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
      const { job_posting_id, applicant_name, applicant_email, applicant_phone, resume_url, cover_letter, salary_expectation } =
        req.body;

      if (!job_posting_id) throw ApiError.badRequest('Job posting ID is required');
      if (!applicant_name) throw ApiError.badRequest('Applicant name is required');
      if (!applicant_email) throw ApiError.badRequest('Applicant email is required');
      if (!applicant_phone) throw ApiError.badRequest('Applicant phone is required');

      const jobPosting = await JobPosting.findByPk(job_posting_id);
      if (!jobPosting) throw ApiError.notFound(`Job posting with ID ${job_posting_id} not found`);

      // Check if applicant already applied for this job
      const existingApplication = await JobApplication.findOne({
        where: { job_posting_id, applicant_email },
      });
      if (existingApplication) throw ApiError.conflict(`This applicant has already applied for this job posting`);

      const application = await JobApplication.create({
        job_posting_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        resume_url,
        cover_letter,
        salary_expectation,
        applied_date: new Date(),
        status: 'applied',
      });

      res.status(201).json({ data: application, message: 'Applicant added successfully' });
    } catch (error) {
      logger.error(`Error creating job application: ${error}`);
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) throw ApiError.badRequest('Status is required');

      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound(`Job application with ID ${id} not found`);

      const validStatuses = ['applied', 'under_review', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'];
      if (!validStatuses.includes(status)) {
        throw ApiError.badRequest(`Invalid status. Allowed values: ${validStatuses.join(', ')}`);
      }

      const oldStatus = application.status;
      await application.update({ status });

      res.json({
        data: application,
        message: `Applicant status updated from '${oldStatus}' to '${status}' successfully`,
      });
    } catch (error) {
      logger.error(`Error updating job application: ${error}`);
      next(error);
    }
  }

  static async scheduleInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { interview_date, interview_notes } = req.body;

      if (!interview_date) throw ApiError.badRequest('Interview date is required');

      const application = await JobApplication.findByPk(id);
      if (!application) throw ApiError.notFound(`Job application with ID ${id} not found`);

      if (application.status === 'rejected' || application.status === 'hired') {
        throw ApiError.badRequest(`Cannot schedule interview for applicant with status: ${application.status}`);
      }

      await application.update({ status: 'interview_scheduled', interview_date, interview_notes });
      res.json({
        data: application,
        message: `Interview scheduled for ${new Date(interview_date).toLocaleDateString()} successfully`,
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
      if (!application) throw ApiError.notFound(`Job application with ID ${id} not found`);

      if (application.status === 'rejected') {
        throw ApiError.badRequest('Cannot send offer to rejected applicant');
      }

      await application.update({ status: 'offered' });
      res.json({
        data: application,
        message: `Offer sent to ${application.applicant_name} successfully`,
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
      if (!application) throw ApiError.notFound(`Job application with ID ${id} not found`);

      if (application.status === 'rejected') {
        throw ApiError.badRequest('Cannot hire rejected applicant');
      }

      await application.update({ status: 'hired' });
      res.json({
        data: application,
        message: `${application.applicant_name} hired successfully`,
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
      if (!application) throw ApiError.notFound(`Job application with ID ${id} not found`);

      if (application.status === 'hired') {
        throw ApiError.badRequest('Cannot reject applicant who is already hired');
      }

      await application.update({ status: 'rejected' });
      res.json({
        data: application,
        message: `${application.applicant_name} rejected successfully`,
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
      if (!application) throw ApiError.notFound(`Job application with ID ${id} not found`);

      if (application.status === 'hired') {
        throw ApiError.badRequest('Cannot delete application for hired applicant');
      }

      const applicantName = application.applicant_name;
      await application.destroy();
      res.json({
        message: `Application for ${applicantName} deleted successfully`,
      });
    } catch (error) {
      logger.error(`Error deleting job application: ${error}`);
      next(error);
    }
  }

  static async getPipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobPostingId } = req.params;

      if (!jobPostingId) throw ApiError.badRequest('Job posting ID is required');

      // Verify job posting exists
      const jobPosting = await JobPosting.findByPk(jobPostingId);
      if (!jobPosting) throw ApiError.notFound(`Job posting with ID ${jobPostingId} not found`);

      // Fetch all applications for this job posting
      const applications = await JobApplication.findAll({
        where: { job_posting_id: jobPostingId },
        order: [['applied_date', 'DESC']],
      });

      // Group applications by pipeline stages
      const pipeline = {
        submitted: applications.filter((app) => app.status === 'applied'),
        under_review: applications.filter((app) => app.status === 'under_review'),
        shortlisted: applications.filter((app) => app.status === 'interviewed'),
        interview_scheduled: applications.filter((app) => app.status === 'interview_scheduled'),
      };

      res.json({
        data: {
          jobPosting: {
            id: jobPosting.id,
            title: jobPosting.title,
          },
          pipeline,
          summary: {
            submitted: pipeline.submitted.length,
            under_review: pipeline.under_review.length,
            shortlisted: pipeline.shortlisted.length,
            interview_scheduled: pipeline.interview_scheduled.length,
            total: applications.length,
          },
        },
      });
    } catch (error) {
      logger.error(`Error fetching application pipeline: ${error}`);
      next(error);
    }
  }
}
