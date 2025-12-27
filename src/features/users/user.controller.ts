import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { UserRepository } from './user.repository';

class UserController {
  static create = async (req: Request, res: Response, next: NextFunction) => {
    Object.assign(req.body.user, { password: '' });
    const result = await UserRepository.create(req.body.user);
    return res.send(ApiResponse({ message: 'User created successfully', data: { id: result.id } }));
  };

  static async get(req: Request, res: Response, next: NextFunction) {
    const { page, rows } = req.pagination!;
    const query = req.reqQuery;

    const { count, rows: users } = await UserRepository.read({
      page,
      rows,
      query,
    });

    if (!users.length) {
      throw ApiError.notFound('No user found');
    }

    res.json(
      ApiResponse({
        data: users,
        message: 'User(s) fetched successfully',
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
    const user = await UserRepository.readById(id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.json(
      ApiResponse({
        data: user,
        message: 'User fetched successfully',
      }),
    );
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    await UserRepository.update(id, req.body.user);

    res.json(
      ApiResponse({
        data: req.body.user,
        message: 'User updated successfully',
      }),
    );
  }
}

export { UserController };
