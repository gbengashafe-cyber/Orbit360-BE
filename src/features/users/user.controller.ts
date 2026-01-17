import { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { UserRepository } from './user.repository';

class UserController {
  static readonly create = async (req: Request, res: Response) => {
    const user = req.validatedBody?.user;
    Object.assign(user, { password: '' });

    const result = await UserRepository.create(user);
    return res.send(ApiResponse({ message: 'User created successfully', data: { id: result.id } }));
  };

  static async get(req: Request, res: Response) {
    const { page, rows } = req.pagination;

    const { count, rows: users } = await UserRepository.read({
      page,
      rows,
      filters: req.parsedQuery,
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
        query: req.parsedQuery,
      }),
    );
  }

  static async getById(req: Request, res: Response) {
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

  static readonly getJobRoles = async (req: Request, res: Response) => {
    const { page, rows } = req.pagination;
    const user = await UserRepository.readJobRoles({ page, rows, filters: req.parsedQuery });

    if (!user) {
      throw ApiError.notFound('No job role found');
    }

    res.json(
      ApiResponse({
        data: user,
        message: 'User fetched successfully',
      }),
    );
  };

  static async update(req: Request, res: Response) {
    const { id } = req.params;

    const user = await UserRepository.readById(id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await UserRepository.update(id, req.body.user);
    const updatedUser = await UserRepository.readById(id);

    res.json(
      ApiResponse({
        data: updatedUser,
        message: 'User updated successfully',
      }),
    );
  }
}

export { UserController };
