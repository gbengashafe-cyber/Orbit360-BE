import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { CompanyRepository } from './company.repository';

class CompanyController {
  static create = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw ApiError.badRequest('Authentication required');
    }

    req.body.company.createdBy = req.user.id;

    const result = await CompanyRepository.add(req.body.company);
    res.send(ApiResponse({ message: 'Company created successfully', data: { id: result.id } }));
  };

  static async get(req: Request, res: Response, next: NextFunction) {
    const { page, rows } = req.pagination!;
    const query = req.parsedQuery;

    const { count, rows: companies } = await CompanyRepository.read({
      page,
      rows,
      query,
    });

    if (!companies.length) {
      throw ApiError.notFound('No company found');
    }

    res.json(
      ApiResponse({
        data: companies,
        message: 'Companies fetched successfully',
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
    const company = await CompanyRepository.readById(id);

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    res.json(
      ApiResponse({
        data: company,
        message: 'Company fetched successfully',
      }),
    );
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    await CompanyRepository.update(id, req.body.company);

    res.json(
      ApiResponse({
        data: req.body.company,
        message: 'Company updated successfully',
      }),
    );
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    const resultCount = await CompanyRepository.delete(id);

    if (!resultCount) {
      throw ApiError.badRequest('Company not found');
    }

    res.json(
      ApiResponse({
        data: { id },
        message: 'Company deleted successfully',
      }),
    );
  }
}

export { CompanyController };
