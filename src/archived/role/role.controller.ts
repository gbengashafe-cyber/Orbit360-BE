import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { RoleRepository } from './role.repository';

class RoleController {
  static create = async (req: Request, res: Response, next: NextFunction) => {
    const result = await RoleRepository.create(req.body.role);
    return res.send(ApiResponse({ message: 'Role created successfully', data: { id: result.id } }));
  };

  static async get(req: Request, res: Response, next: NextFunction) {
    const { page, rows } = req.pagination!;
    const query = req.reqQuery;

    const { count, rows: roles } = await RoleRepository.read({
      page,
      rows,
      query,
    });

    if (!roles.length) {
      throw ApiError.notFound('No role found');
    }

    res.json(
      ApiResponse({
        data: roles,
        message: 'Role(s) fetched successfully',
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
        query,
      }),
    );
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const role = await RoleRepository.readById(id);

    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    res.json(
      ApiResponse({
        data: role,
        message: 'Role fetched successfully',
      }),
    );
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    await RoleRepository.update(id, req.body.role);

    res.json(
      ApiResponse({
        data: { ...req.body.role, id },
        message: 'Role updated successfully',
      }),
    );
  }
}

export { RoleController };
