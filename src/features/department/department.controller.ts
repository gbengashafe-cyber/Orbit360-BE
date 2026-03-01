import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { Department } from './department.model';
import { DepartmentRepository } from './department.repository';

export class DepartmentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.pagination!;
      const offset = (page - 1) * rows;

      const { count, rows: departments } = await Department.findAndCountAll({
        limit: rows,
        offset,
        order: [['createdAt', 'DESC']],
        include: [{ association: 'company', attributes: ['id', 'name', 'description'] }],
      });

      res.json(
        ApiResponse({
          data: departments,
          message: '',
          pagination: {
            total: count,
            page,
            rows,
            pages: Math.ceil(count / rows),
          },
        }),
      );
    } catch (error) {
      logger.error(`Error fetching departments: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const department = await Department.findByPk(id, {
        include: [{ association: 'company', attributes: ['id', 'name', 'description'] }],
      });

      if (!department) {
        throw ApiError.notFound('Department not found');
      }

      res.json(ApiResponse({ data: department, message: '' }));
    } catch (error) {
      logger.error(`Error fetching department: ${error}`);
      next(error);
    }
  }

  static readonly getDepartmentEmployees = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rows, page } = req.pagination;

    const departmentEmployees = await DepartmentRepository.getEmployees(id, { page, rows, filters: req.parsedQuery });

    const responsePayload = departmentEmployees ? departmentEmployees : { employees: [] };

    res.json(ApiResponse({ data: responsePayload, message: '' }));
  };

  static readonly getDepartmentJobRoles = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rows, page } = req.pagination;

    const departmentJobRoles = await DepartmentRepository.getJobRoles(id, { page, rows, filters: req.parsedQuery });

    res.json(ApiResponse({ data: departmentJobRoles || [], message: '' }));
  };

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, companyId } = req.body;

      const department = await Department.create({
        name,
        description,
        companyId,
      });

      res.status(201).json(ApiResponse({ data: department, message: 'Department created successfully' }));
    } catch (error) {
      logger.error(`Error creating department: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const department = await Department.findByPk(id);
      if (!department) {
        throw ApiError.notFound('Department not found');
      }

      await department.update({ name, description });

      res.json(ApiResponse({ data: department, message: 'Department updated successfully' }));
    } catch (error) {
      logger.error(`Error updating department: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const department = await Department.findByPk(id);
      if (!department) {
        throw ApiError.notFound('Department not found');
      }

      await department.destroy();

      res.json(ApiResponse({ data: {}, message: 'Department deleted successfully' }));
    } catch (error) {
      logger.error(`Error deleting department: ${error}`);
      next(error);
    }
  }
}
