import { Request, Response } from 'express';
import { CreationAttributes } from 'sequelize';
import { ApiError } from '../../../utils/api-error';
import { ApiResponse } from '../../../utils/api-response';
import { LoanService } from '../loan-service';
import { LoanRepository } from '../loan.repository';
import { LoanTypeService } from './loan-type-service';
import { LoanType } from './loan-types.model';

export class LoanTypeController {
  static readonly getLoanTypes = async (_req: Request, res: Response) => {
    const result = await LoanTypeService.getLoanTypes();

    res.json(
      ApiResponse({
        data: result,
        message: 'Fetched loan types successfully',
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
    const loanTypePayload: CreationAttributes<LoanType> = req.body.validated.loanType;

    const loanType = await LoanTypeService.createLoanType(loanTypePayload);

    res.status(201).json(ApiResponse({ data: { id: loanType.id }, message: 'Loan type created successfully' }));
  };

  static readonly update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const loanRequest = req.body.validated.loan;

    const updatedLoan = await LoanService.editLoan(Number(id), loanRequest);

    res.json(ApiResponse({ data: updatedLoan, message: 'Payroll updated successfully' }));
  };
}
