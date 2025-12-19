import { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { DeductionRepository } from './deduction.repository';

class DeductionController {
  static create = async (req: Request, res: Response, next) => {
    const deduction = req.body.deduction;

    const result = await DeductionRepository.add(deduction);
    res.status(201).json(ApiResponse({ message: 'Deduction created successfully', data: result.id }));
  };

  static async get(req: Request, res: Response, next) {
    const { page, rows } = req.body.pagination!;
    const query = req.body.query;

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

  static async update(req: Request, res: Response, next) {
    const { id } = req.params;

    await DeductionRepository.update(id, req.body.deduction);

    res.json(
      ApiResponse({
        data: req.body.deduction,
        message: 'Deduction updated successfully',
      }),
    );
  }

  static async delete(req: Request, res: Response, next) {
    const { id } = req.params;

    const resultCount = await DeductionRepository.delete(id);

    if (!resultCount) {
      throw ApiError.badRequest('Deduction not found');
    }

    res.json(
      ApiResponse({
        data: { id },
        message: 'Deduction deleted successfully',
      }),
    );
  }
}

export { DeductionController };
