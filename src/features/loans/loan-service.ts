import { ApiError } from '../../utils/api-error';
import { LoanAuditLog } from './loan-audit-log.model';
import { LoanRepository } from './loan.repository';

type ApprovalProps = {
  loanId: number;
  approverId: number;
  userEmployeeId: number;
  approverNote: string;
};

type ReviewProps = {
  employeeId: number;
  loanId: number;
  reviewerDecision: string;
  reviewerId: number;
  reviewerNote: string;
};

export class LoanService {
  static readonly createLoan = async (data: any, userId: number) => {
    const loan = await LoanRepository.create({
      ...data,
      reviewedBy: userId,
      status: 'PENDING_APPROVAL',
      nextStep: 'PENDING_DISBURSEMENT',
    });

    await LoanAuditLog.create({
      loanId: loan.id,
      userId: userId,
      action: 'CREATE',
      details: 'Loan application initiated.',
    });

    return loan;
  };

  static readonly editLoan = async (id: number, data: any) => {
    const loan = await LoanRepository.readById(id);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    if (['PENDING_APPROVAL', 'PENDING_DISBURSEMENT', 'PAID_OFF', 'REJECTED'].includes(loan.status)) {
      throw ApiError.badRequest(`Cannot modify loan in ${loan.status} state.`);
    }

    await LoanRepository.update(Number(id), data);

    const updatedLoan = await LoanRepository.readById(id);

    return updatedLoan;
  };

  static readonly reviewLoanRequest = async ({ employeeId, loanId, reviewerDecision, reviewerId, reviewerNote }: ReviewProps) => {
    const loanRecord = await LoanRepository.readById(loanId);

    if (!loanRecord) {
      throw ApiError.notFound('Loan not found');
    }

    if (loanRecord.status.toUpperCase() !== 'PENDING_REVIEW') {
      throw ApiError.badRequest('This loan is not pending review');
    }

    const isLoanOwner = loanRecord.employeeId === employeeId;
    if (isLoanOwner) {
      throw ApiError.forbidden('You cannot review/approve your own loan request');
    }

    if (reviewerDecision.toLowerCase() === 'approve') {
      return loanRecord.update({ status: loanRecord.nextStep, nextStep: 'ACTIVE', reviewedBy: reviewerId, reviewerNote });
    }

    return loanRecord.update({ status: 'REJECTED', reviewedBy: reviewerId, reviewerNote });
  };

  private static readonly checkApproval = ({ loan, userEmployeeId, approverId }) => {
    if (loan.employeeId === userEmployeeId) {
      throw ApiError.badRequest('You cannot approve/reject your own loan');
    }

    if (loan.reviewedBy === approverId) {
      throw ApiError.badRequest('Maker-Checker violation: You cannot approve/reject a loan you reviewed.');
    }

    if (loan.status !== 'PENDING_APPROVAL') {
      throw ApiError.badRequest(`This loan is not pending approval`);
    }
  };

  static readonly approveLoan = async ({ loanId, approverId, userEmployeeId, approverNote }: ApprovalProps) => {
    const loan = await LoanRepository.readById(loanId);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    this.checkApproval({ loan, userEmployeeId, approverId });

    await loan.update({
      ...loan,
      status: 'PENDING_DISBURSEMENT',
      approvedBy: approverId,
      approvedDate: new Date(),
      nextStep: 'ACTIVE',
      approverNote,
    });
  };

  static readonly rejectLoan = async ({ loanId, approverId, approverNote, userEmployeeId }: ApprovalProps) => {
    const loan = await LoanRepository.readById(loanId);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    this.checkApproval({ loan, userEmployeeId, approverId });

    return loan.update({
      status: 'REJECTED',
      approvedBy: approverId,
      approvedDate: new Date(),
      approverNote,
    });
  };

  static readonly getLoans = async ({ page, rows, status, employeeId }) => {
    const filters: any = {};

    if (status) filters.status = status;
    if (employeeId) filters.employeeId = employeeId;

    return await LoanRepository.read({ page, rows, filters });
  };

  static readonly updateStatus = async (id: number, status: string, approverId: number) => {
    const updateData: any = { status };

    if (status === 'ACTIVE') {
      updateData.approvedBy = approverId;
      updateData.approvedDate = new Date();
      updateData.nextStep = 'PAID_OFF';
    }

    return LoanRepository.update(id, updateData);
  };
}
