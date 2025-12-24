import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { Position } from './position.model';

export class PositionController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: positions } = await Position.findAndCountAll({
        limit: rows,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: positions,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching positions: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const position = await Position.findByPk(id, {
        include: [{ association: 'employees', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });

      if (!position) {
        throw ApiError.notFound('Position not found');
      }

      res.json({ data: position });
    } catch (error) {
      logger.error(`Error fetching position: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description } = req.body;

      const position = await Position.create({
        title,
        description,
      });

      res.status(201).json({ data: position, message: 'Position created successfully' });
    } catch (error) {
      logger.error(`Error creating position: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description } = req.body;

      const position = await Position.findByPk(id);
      if (!position) {
        throw ApiError.notFound('Position not found');
      }

      await position.update({ title, description });

      res.json({ data: position, message: 'Position updated successfully' });
    } catch (error) {
      logger.error(`Error updating position: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const position = await Position.findByPk(id);
      if (!position) {
        throw ApiError.notFound('Position not found');
      }

      await position.destroy();

      res.json({ message: 'Position deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting position: ${error}`);
      next(error);
    }
  }
}
