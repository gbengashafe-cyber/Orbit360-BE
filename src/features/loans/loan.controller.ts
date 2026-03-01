import { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { LoanService } from './loan-service';
import { LoanRepository } from './loan.repository';

export class LoanController {
  static readonly getDashboard = async (_req: Request, res: Response) => {
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
    const filters = req.parsedQuery;

    const { count, rows: loans } = await LoanService.getLoans({
      rows,
      page,
      status: filters?.search,
      employeeId: filters?.employeeId,
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

  static readonly update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const loanRequest = req.body.validated.loan;

    const updatedLoan = await LoanService.editLoan(Number(id), loanRequest);

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

  static readonly reviewLoanRequest = async (req: Request, res: Response) => {
    const employeeId = req.user?.employeeRecord?.id;
    const loanId = req.params?.loanId;
    const reviewerId = req.user?.id;

    const validatedPayload = req.body.validated?.validatedPayload;

    await LoanService.reviewLoanRequest({
      employeeId: Number(employeeId),
      loanId: Number(loanId),
      payload: validatedPayload,
      reviewerId: Number(reviewerId),
    });

    res.status(201).json(ApiResponse({ message: 'Request treated successfully', data: {} }));
  };

  static readonly approveReview = async (req: Request, res: Response) => {
    const { loanId } = req.params;
    const approverId = req.user?.id as number;
    const userEmployeeId = req.user?.employeeRecord?.id as number;
    const approverNote = req.body.validated?.approvalNote as string;

    await LoanService.approveLoanReview({ loanId: Number(loanId), approverId, userEmployeeId, approverNote });

    return res.json(
      ApiResponse({
        data: { id: loanId },
        message: 'Loan review has been approved',
      }),
    );
  };

  static readonly reject = async (req: Request, res: Response) => {
    const { loanId } = req.params;
    const approverNote = req.body.validated?.approverNote as string;
    const approverId = req.user?.id as number;
    const userEmployeeId = req.user?.employeeRecord?.id as number;

    if (!loanId) {
      throw ApiError.badRequest('The loan ID is required');
    }

    await LoanService.rejectLoanReview({ loanId: Number(loanId), approverId, approverNote, userEmployeeId });

    return res.json(
      ApiResponse({
        data: { id: loanId },
        message: 'Loan application has been rejected.',
      }),
    );
  };
}
