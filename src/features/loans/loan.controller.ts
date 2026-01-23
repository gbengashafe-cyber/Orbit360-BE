import { Request, Response } from 'express';
import { CreationAttributes } from 'sequelize';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { Loan } from './loan.model';
import { LoanRepository } from './loan.repository';

export class LoanController {
  static readonly getDashboard = async (req: Request, res: Response) => {
    const result = await LoanRepository.getDashboard();

    res.json(
      ApiResponse({
        data: result,
        message: 'Fetched loan record(s) successfully',
      }),
    );
  };
  static readonly get = async (req: Request, res: Response) => {
    const { page, rows } = req.pagination;

    const { count, rows: loans } = await LoanRepository.read({
      rows,
      page,
    });

    res.json(
      ApiResponse({
        data: loans,
        message: 'Fetched loan record(s) successfully',
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      }),
    );
  };

  static readonly getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const loan = await LoanRepository.readById(id);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    res.json(ApiResponse({ data: loan, message: 'Loan record fetched successfully' }));
  };

  static readonly create = async (req: Request, res: Response) => {
    const loanPayload: CreationAttributes<Loan> = req.body.validated.loan;

    loanPayload.createdBy = Number(req.user?.id);

    const loan = await LoanRepository.create(loanPayload);

    res.status(201).json(ApiResponse({ data: { id: loan.id }, message: 'loan created successfully' }));
  };

  static readonly update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const loanRequest = req.body.validated.loan;

    const loan = await LoanRepository.readById(id);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    await LoanRepository.update(Number(id), loanRequest);

    const updatedLoan = await LoanRepository.readById(id);

    res.json(ApiResponse({ data: updatedLoan, message: 'Payroll updated successfully' }));
  };
  static readonly delete = async (req: Request, res: Response) => {
    const { id } = req.params;

    const loan = await LoanRepository.readById(id);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    await LoanRepository.delete(Number(id));

    res.json(ApiResponse({ data: { id }, message: 'Loan record deleted successfully' }));
  };
}
