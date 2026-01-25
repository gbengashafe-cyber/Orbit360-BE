import { NextFunction, Request, Response } from 'express';
import { JobPosting } from './job-posting.model';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/api-error';

export class JobPostingController {
  static async getAll(req: Request, res: Response) {
    const { page, rows } = req.pagination!;
    const offset = (page - 1) * rows;
    const { status } = req.query;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: postings } = await JobPosting.findAndCountAll({
      where: whereClause,
      limit: rows,
      offset,
      order: [['posted_date', 'DESC']],
    });

    res.json(
      ApiResponse({
        data: postings,
        message: '',
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      }),
    );
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const posting = await JobPosting.findByPk(id, {
        include: [
          {
            association: 'applications',
            attributes: ['id', 'applicant_name', 'applicant_email', 'status', 'applied_date'],
          },
        ],
      });

      if (!posting) {
        throw ApiError.notFound('Job posting not found');
      }

      res.json(ApiResponse({ data: posting, message: '' }));
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

      res.status(201).json({
        data: posting,
        message: 'Job posting created successfully',
      });
    } catch (error) {
      logger.error(`Error creating job posting: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, department, location, employment_type, salary_range_min, salary_range_max, requirements } =
        req.body;

      const posting = await JobPosting.findByPk(id);
      if (!posting) {
        throw ApiError.notFound('Job posting not found');
      }

      await posting.update({
        title,
        description,
        department,
        location,
        employment_type,
        salary_range_min,
        salary_range_max,
        requirements,
      });

      res.json({
        data: posting,
        message: 'Job posting updated successfully',
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

      const posting = await JobPosting.findByPk(id);
      if (!posting) {
        throw ApiError.notFound('Job posting not found');
      }

      await posting.update({
        status: 'active',
        approved_by,
        approved_date: new Date(),
      });

      res.json({
        data: posting,
        message: 'Job posting approved',
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
      if (!posting) {
        throw ApiError.notFound('Job posting not found');
      }

      await posting.update({ status: 'rejected' });

      res.json({
        data: posting,
        message: 'Job posting rejected',
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
      if (!posting) {
        throw ApiError.notFound('Job posting not found');
      }

      await posting.update({
        status: 'closed',
        closedDate: new Date(),
      });

      res.json({
        data: posting,
        message: 'Job role closed',
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
      if (!posting) {
        throw ApiError.notFound('Job posting not found');
      }

      await posting.destroy();

      res.json({ message: 'Job posting deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting job posting: ${error}`);
      next(error);
    }
  }
}
