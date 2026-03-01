import { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { CompanyRepository } from './company.repository';

class CompanyController {
  static readonly create = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw ApiError.badRequest('Authentication required');
    }
    const { company } = req.body.validated;
    company.createdBy = req.user.id;

    const result = await CompanyRepository.add(company);
    res.send(ApiResponse({ message: 'Company created successfully', data: { id: result.id } }));
  };

  static async get(req: Request, res: Response) {
    const { page, rows } = req.pagination;

    const { count, rows: companies } = await CompanyRepository.read({
      page,
      rows,
    });

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
      }),
    );
  }

  static async getById(req: Request, res: Response) {
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

  static async getDepartments(req: Request, res: Response) {
    const companyId = req.params?.companyId as unknown as number;

    const company = await CompanyRepository.readDepartments(companyId);

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

  static async update(req: Request, res: Response) {
    const { id } = req.params;

    await CompanyRepository.update(id, req.body.company);

    res.json(
      ApiResponse({
        data: req.body.company,
        message: 'Company updated successfully',
      }),
    );
  }

  static async delete(req: Request, res: Response) {
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
