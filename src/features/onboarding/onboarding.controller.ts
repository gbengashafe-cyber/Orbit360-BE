import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { Employee } from '../employee/employee.model';
import { Onboarding } from './onboarding.model';

export class OnboardingController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, documentType, documentName, documentUrl, notes } = req.body;

      const onboarding = await Onboarding.create({
        employeeId,
        documentType,
        documentName,
        documentUrl,
        notes,
        status: 'pending',
      });

      const createdOnboarding = await Onboarding.findByPk(onboarding.id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.status(201).json({ data: createdOnboarding, message: 'Document created successfully' });
    } catch (error) {
      logger.error(`Error creating onboarding document: ${error}`);
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: onboardings } = await Onboarding.findAndCountAll({
        limit: rows,
        offset,
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: onboardings,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching onboardings: ${error}`);
      next(error);
    }
  }

  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: onboardings } = await Onboarding.findAndCountAll({
        where: { employeeId },
        limit: rows,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: onboardings,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching employee onboardings: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const onboarding = await Onboarding.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      if (!onboarding) {
        throw ApiError.notFound('Onboarding not found');
      }

      res.json({ data: onboarding });
    } catch (error) {
      logger.error(`Error fetching onboarding: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, documentUrl, notes } = req.body;

      const onboarding = await Onboarding.findByPk(id);
      if (!onboarding) {
        throw ApiError.notFound('Document not found');
      }

      const updateData: any = { status, notes };
      
      if (documentUrl) updateData.documentUrl = documentUrl;
      if (status === 'submitted') updateData.submittedAt = new Date();
      if (status === 'approved' || status === 'rejected') {
        updateData.reviewedBy = req.user?.id;
        updateData.reviewedAt = new Date();
      }

      await onboarding.update(updateData);

      const updatedOnboarding = await Onboarding.findByPk(id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      res.json({ data: updatedOnboarding, message: 'Document updated successfully' });
    } catch (error) {
      logger.error(`Error updating onboarding document: ${error}`);
      next(error);
    }
  }
}
