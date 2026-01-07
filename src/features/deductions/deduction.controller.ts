import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { DeductionRepository } from './deduction.repository';

class DeductionController {
  static create = async (req: Request, res: Response, next) => {
    const deduction = req.body.validated.deduction;

    const result = await DeductionRepository.add(deduction);
    res.status(201).json(ApiResponse({ message: 'Deduction created successfully', data: result.id }));
  };

  static async get(req: Request, res: Response, next) {
    const { page, rows } = req.pagination!;
    const query = req.parsedQuery;

    const { count, rows: deductions } = await DeductionRepository.read({
      page,
      rows,
      query,
    });

    if (!deductions.length) {
      throw ApiError.notFound('No deduction found');
    }

    res.json(
      ApiResponse({
        data: deductions,
        message: 'Deduction(s) fetched successfully',
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

  static async getById(req: Request, res: Response, next) {
    const { id } = req.params;

    const deduction = await DeductionRepository.readById(id);

    if (!deduction) {
      throw ApiError.notFound('deduction not found');
    }

    res.json(
      ApiResponse({
        data: deduction,
        message: 'Deduction fetched successfully',
      }),
    );
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    const [count] = await DeductionRepository.update(id, req.body.validated.deduction);

    if (!count) {
      throw ApiError.notFound('Deduction not found');
    }

    res.json(
      ApiResponse({
        data: req.body.deduction,
        message: 'Deduction updated successfully',
      }),
    );
  }
}

export { DeductionController };
