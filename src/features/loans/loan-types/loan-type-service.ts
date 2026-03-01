import { ApiError } from '../../../utils/api-error';
import { LoanRepository } from '../loan.repository';
import { LoanType } from './loan-types.model';

export class LoanTypeService {
  static readonly createLoanType = async (data: any) => {
    const loanType = await LoanType.create({
      ...data,
      isActive: true,
    });

    return loanType;
  };

  static readonly getLoanTypes = async () => {
    return LoanType.findAll({ where: { isActive: true } });
  };

  static readonly editLoanType = async (id: number, data: any) => {
    const loanType = await LoanType.findByPk(id);

    if (!loanType) {
      throw ApiError.notFound('Loan type not found');
    }

    await LoanType.update(data, { where: { id } });

    const updatedLoan = await LoanRepository.readById(id);

    return updatedLoan;
  };

  static readonly disableLoanType = async (id: number) => {
    const loanType = await LoanType.findByPk(id);

    if (!loanType) {
      throw ApiError.notFound('Loan type not found');
    }

    return LoanType.update({ isActive: false }, { where: { id } });
  };
}
