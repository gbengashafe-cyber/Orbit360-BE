import { CreationAttributes } from 'sequelize';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { EmployeeRepository } from '../employee/employee.repository';
import { LoanPayment } from '../loans/loan-payment.model';
import { LoanRepository } from '../loans/loan.repository';
import { PayrollBatch } from './payroll-batch.model';
import { Payroll } from './payroll.model';
import { PayrollRepository } from './payroll.repository';
import { calculatePayroll } from './payroll.utils';

export class PayrollService {
  static readonly generateBatch = async (payPeriod, makerId: number, overwrite: boolean) => {
    const CHUNK_SIZE = 500;
    const existingPayroll = await PayrollRepository.payPeriodExist(payPeriod);
    let totalGross = 0;
    let totalNet = 0;
    let payrollCounter = 0;
    const batchId = `${payPeriod}-${Date.now()}`;

    if (existingPayroll && ['APPROVED'].includes(existingPayroll.status.toUpperCase()) && !overwrite) {
      throw ApiError.badRequest('Payroll for this period already exists. Kindly use overwrite to regenerate.');
    }

    if (existingPayroll?.status === 'PENDING_APPROVAL') {
      throw ApiError.badRequest('Another payroll batch is pending approval. Kindly clear and process again');
    }

    return await db.transaction(async (transaction) => {
      if (existingPayroll && overwrite) {
        await LoanRepository.deleteRepaymentByPayPeriod(payPeriod, transaction);
        await PayrollRepository.deleteByPayPeriod(payPeriod, transaction);
        await PayrollRepository.cancelBatch(existingPayroll.id, transaction);
      }

      const pensionRate = 0.08;
      let page = 1;
      let hasMore = true;

      const batch = await PayrollBatch.create(
        {
          batchId,
          payPeriod,
          totalGross,
          totalNet,
          recordCount: payrollCounter,
          createdBy: makerId,
          status: 'PENDING_APPROVAL',
        },
        { transaction },
      );

      while (hasMore) {
        const activeEmployees = await EmployeeRepository.activeEmployeesCompensation({ rows: CHUNK_SIZE, page });

        if (page === 1 && activeEmployees.length === 0) {
          throw ApiError.badRequest('No active employee found. Kindly create employees and try again.');
        }

        if (!activeEmployees?.length) {
          break;
        }

        // Fetch all loans for this chunk at once to avoid N+1 performance issues
        const employeeIds = activeEmployees.map((e) => e.id);
        const allLoansForChunk = await LoanRepository.readEmployeesActiveLoans(employeeIds);

        const payrollData = [] as CreationAttributes<Payroll>[];
        const loanPaymentsData = [] as CreationAttributes<LoanPayment>[];

        for (const _employee of activeEmployees) {
          const employeeActiveLoans = allLoansForChunk.filter((l) => l.employeeId === _employee.id);

          const { payroll, applicableLoansForPeriod, netSalary } = calculatePayroll({
            employee: _employee,
            payPeriod,
            pensionRate,
            activeLoans: employeeActiveLoans,
          });

          // 1. Prepare Payroll record
          payrollData.push({
            ...payroll,
            payPeriod,
            batchId,
            employeeId: _employee.id,
          });

          // 2. Prepare Loan Payment records with payPeriod instead of payrollId
          if (applicableLoansForPeriod.length > 0) {
            const mappedLoans = applicableLoansForPeriod.map((loan) => ({
              ...loan,
              payPeriod,
            }));
            loanPaymentsData.push(...mappedLoans);
          }

          totalGross += Number(payroll.grossSalary);
          totalNet += Number(netSalary);
        }

        // 3. Batch insert both for maximum performance
        await PayrollRepository.bulkCreate(payrollData, transaction);

        if (loanPaymentsData.length > 0) {
          await LoanRepository.createLoanPayment(loanPaymentsData, transaction);
        }

        payrollCounter += payrollData.length;

        if (activeEmployees.length < CHUNK_SIZE) hasMore = false;
        page++;
      }

      await batch.update({ totalGross, totalNet, recordCount: payrollCounter }, { transaction });

      return batch;
    });
  };

  private static readonly checkApproval = (batch, checkerId) => {
    if (batch.createdBy === checkerId) throw ApiError.badRequest('Maker-Checker Violation: Initiator cannot approve.');
    if (batch.status !== 'PENDING_APPROVAL') throw ApiError.badRequest('Batch is not pending approval.');
  };

  static readonly approveBatch = async (batchId: string, checkerId: number, approverNote: string) => {
    const batch = await PayrollBatch.findOne({ where: { id: batchId } });

    if (!batch) throw ApiError.notFound('Payroll batch not found.');

    this.checkApproval(batch, checkerId);

    return await db.transaction(async (transaction) => {
      await batch.update(
        {
          status: 'APPROVED',
          approvedBy: checkerId,
          approvalDate: new Date(),
          approverNote,
        },
        { transaction },
      );
      return Payroll.update({ status: 'APPROVED' }, { where: { batchId: batch.batchId }, transaction });
    });
  };

  static readonly rejectBatch = async (batchId: string, checkerId: number, approverNote: string) => {
    const batch = await PayrollBatch.findOne({ where: { id: batchId } });

    if (!batch) throw ApiError.notFound('Payroll batch not found.');

    this.checkApproval(batch, checkerId);

    return await db.transaction(async (transaction) => {
      await batch.update(
        {
          status: 'REJECTED',
          approvedBy: checkerId,
          approvalDate: new Date(),
          approverNote,
        },
        { transaction },
      );
      return Payroll.destroy({ where: { batchId: batch.batchId }, transaction });
    });
  };
}
