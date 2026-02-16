import { AuditLog } from '../../audit-log/audit-log.model';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { LoanRepository } from './loan.repository';

type ApprovalProps = {
  loanId: number;
  approverId: number;
  userEmployeeId: number;
  approverNote: string;
};

type ReviewProps = {
  loanId: number;
  employeeId: number;
  payload: { reviewerDecision: string; reviewerNote: string };
  reviewerId: number;
};

export class LoanService {
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

  static readonly reviewLoanRequest = async ({ employeeId, loanId, reviewerId, payload }: ReviewProps) => {
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

    const nextStep = payload.reviewerDecision.toUpperCase() === 'APPROVE' ? 'ACTIVE' : 'REJECTED';

    await db.transaction(async (transaction) => {
      await loanRecord.update({ status: loanRecord.nextStep, nextStep, reviewedBy: reviewerId, ...payload }, { transaction });

      await AuditLog.create(
        {
          entity: 'Loan',
          entityId: String(loanRecord.id),
          userId: reviewerId,
          action: 'UPDATE',
          description: `REVIEWED LOAN REQUEST. Reviewer decision: ${loanRecord.reviewerDecision}`,
        },
        { transaction },
      );
    });

    return loanRecord.update({ status: loanRecord.nextStep, nextStep, reviewedBy: reviewerId, ...payload });
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

  static readonly approveLoanReview = async ({ loanId, approverId, userEmployeeId, approverNote }: ApprovalProps) => {
    const loan = await LoanRepository.readById(loanId);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    this.checkApproval({ loan, userEmployeeId, approverId });

    const status = loan.reviewerDecision.toUpperCase() === 'APPROVE' ? 'PENDING_DISBURSEMENT' : 'REJECTED';
    const nextStep = status === 'PENDING_DISBURSEMENT' ? 'ACTIVE' : loan.nextStep;

    await db.transaction(async (transaction) => {
      await loan.update(
        {
          status,
          approvedBy: approverId,
          approvedDate: new Date(),
          nextStep,
          approverNote,
        },
        { transaction },
      );

      await AuditLog.create(
        {
          entity: 'Loan',
          entityId: String(loan.id),
          userId: approverId,
          action: 'UPDATE',
          description: `APPROVED LOAN REVIEW. Reviewer decision: ${loan.reviewerDecision}`,
        },
        { transaction },
      );
    });
  };

  static readonly rejectLoanReview = async ({ loanId, approverId, approverNote, userEmployeeId }: ApprovalProps) => {
    const loan = await LoanRepository.readById(loanId);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    this.checkApproval({ loan, userEmployeeId, approverId });

    await db.transaction(async (transaction) => {
      await loan.update(
        {
          status: 'PENDING_REVIEW',
          approvedBy: approverId,
          approvedDate: new Date(),
          approverNote,
        },
        { transaction },
      );

      await AuditLog.create(
        {
          entity: 'Loan',
          entityId: String(loan.id),
          userId: approverId,
          action: 'UPDATE',
          description: `REJECTED LOAN REVIEW. Reviewer decision: ${loan.reviewerDecision}`,
        },
        { transaction },
      );
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
