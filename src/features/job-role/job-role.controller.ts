import { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { JobRole } from './job-role.model';
import { JobRoleRepository } from './job-role.repository';

export class JobRoleController {
  static async getAll(req: Request, res: Response) {
    const { page, rows } = req.pagination;
    const offset = (page - 1) * rows;

    const { count, rows: jobRoles } = await JobRole.findAndCountAll({
      limit: rows,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json(
      ApiResponse({
        data: jobRoles,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      }),
    );
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const jobRole = await JobRoleRepository.readById(id);

    if (!jobRole) {
      throw ApiError.notFound('Job role not found');
    }

    res.json(ApiResponse({ data: jobRole }));
  }

  static async create(req: Request, res: Response) {
    const jobRole = req.body.validated?.jobRole;

    const jobRoleRecord = await JobRole.create(jobRole);

    res.status(201).json(ApiResponse({ data: { id: jobRoleRecord.id }, message: 'Job role created successfully' }));
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const jobRole = req.body;

    const jobRoleRecord = await JobRoleRepository.readById(id);

    if (!jobRoleRecord) {
      throw ApiError.notFound('Job role not found');
    }

    await jobRoleRecord.update(jobRole);

    res.json(ApiResponse({ data: jobRoleRecord, message: 'Job role updated successfully' }));
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;

    const jobRole = await JobRole.findByPk(id);
    if (!jobRole) {
      throw ApiError.notFound('Job role not found');
    }

    await jobRole.destroy();

    res.json(ApiResponse({ message: 'job role deleted successfully', data: {} }));
  }
}
