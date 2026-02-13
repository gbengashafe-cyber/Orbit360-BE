import { ApiError } from '../../utils/api-error';
import { LoanAuditLog } from './loan-audit-log.model';
import { LoanRepository } from './loan.repository';

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

  static readonly approveLoan = async (loanId: number, approverId: number) => {
    const loan = await LoanRepository.readById(loanId);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    if (loan.reviewedBy === approverId) {
      throw ApiError.badRequest('Maker-Checker violation: You cannot approve a loan you initiated.');
    }

    if (loan.status !== 'PENDING_APPROVAL') {
      throw ApiError.badRequest(`Cannot approve loan with status: ${loan.status}`);
    }

    await LoanRepository.update(loanId, {
      ...loan,
      status: 'PENDING_DISBURSEMENT',
      approvedBy: approverId,
      approvedDate: new Date(),
      nextStep: 'ACTIVE',
    });

    await LoanAuditLog.create({
      loanId: loanId,
      userId: approverId,
      action: 'APPROVE',
      details: 'Loan approved by checker. Status moved to PENDING_DISBURSEMENT.',
    });
  };

  static readonly rejectLoan = async (loanId: number, approverId: number, notes: string) => {
    const loan = await LoanRepository.readById(loanId);

    if (!loan) {
      throw ApiError.notFound('Loan record not found');
    }

    if (loan?.reviewedBy === approverId) {
      throw ApiError.badRequest('You cannot approve/reject a loan you initiated.');
    }

    return LoanRepository.update(loanId, {
      ...loan,
      status: 'REJECTED',
      approvedBy: approverId,
      approvedDate: new Date(),
      approverNote: notes || 'Loan application rejected by checker.',
      nextStep: 'REJECTED',
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
