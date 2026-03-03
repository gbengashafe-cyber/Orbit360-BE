import config from 'config';
import { CreationAttributes, Transaction } from 'sequelize';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { Employee } from '../employee/employee.model';
import { EmployeeRepository } from '../employee/employee.repository';
import { LoanPayment } from '../loans/loan-payment.model';
import { LoanRepository } from '../loans/loan.repository';
import { PayrollBatch } from './payroll-batch.model';
import { Payroll } from './payroll.model';
import { PayrollRepository } from './payroll.repository';
import { calculatePayroll, PayPeriod } from './payroll.utils';

type GenerateBatchProp = {
  payPeriod: PayPeriod;
  makerId: number;
  overwrite: boolean;
  companyId: number;
};
type ReviewBatchProp = { id: number; checkerId: number; approverNote: string };

export class PayrollService {
  private static readonly processChunk = async ({
    activeEmployees,
    payPeriod,
    batchId,
    pensionRate,
    transaction,
    companyId,
  }: {
    activeEmployees: Employee[];
    payPeriod: PayPeriod;
    batchId: string;
    pensionRate: number;
    transaction: Transaction;
    companyId: number;
  }): Promise<{
    payrollData: CreationAttributes<Payroll>[];
    loanPaymentsData: CreationAttributes<LoanPayment>[];
    totalGross: number;
    totalNet: number;
  }> => {
    const employeeIds = activeEmployees.map((e) => e.id);
    const allLoansForChunk = await LoanRepository.readEmployeesActiveLoans(employeeIds, transaction);

    const payrollData = [] as CreationAttributes<Payroll>[];
    const loanPaymentsData = [] as CreationAttributes<LoanPayment>[];
    let totalGross = 0;
    let totalNet = 0;

    for (const _employee of activeEmployees) {
      const employeeActiveLoans = allLoansForChunk.filter((l) => l.employeeId === _employee.id);

      const { payroll, applicableLoansForPeriod, netSalary } = calculatePayroll({
        employee: _employee,
        payPeriod,
        pensionRate,
        activeLoans: employeeActiveLoans,
      });

      payrollData.push({
        ...payroll,
        payPeriod,
        batchId,
        employeeId: _employee.id,
        companyId,
      });

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

    await PayrollRepository.bulkCreate(payrollData, transaction);

    if (loanPaymentsData.length > 0) {
      await LoanRepository.createLoanPayment(loanPaymentsData, transaction);
    }

    return { payrollData, loanPaymentsData, totalGross, totalNet };
  };

  static readonly generateBatch = async ({ payPeriod, makerId, overwrite, companyId }: GenerateBatchProp) => {
    const existingPayroll = await PayrollRepository.payPeriodExist({ payPeriod, companyId });

    if (existingPayroll && ['APPROVED'].includes(existingPayroll.status.toUpperCase()) && !overwrite) {
      throw ApiError.badRequest('Payroll for this period already exists. Kindly use overwrite to regenerate.');
    }

    if (existingPayroll?.status === 'PENDING_APPROVAL') {
      throw ApiError.badRequest('Another payroll batch is pending approval. Kindly clear and process again');
    }

    return await db.transaction(async (transaction) => {
      if (existingPayroll && overwrite) {
        await LoanRepository.deleteRepaymentByPayPeriod({ payPeriod, companyId }, transaction);
        await PayrollRepository.deleteByPayPeriod({ payPeriod, companyId }, transaction);
        await PayrollRepository.cancelBatch(existingPayroll.id, transaction);
      }

      const CHUNK_SIZE = 500;
      const batchId = crypto.randomUUID();
      const pensionRate = config.get<number>('payroll.pensionRate');
      let page = 1;
      let hasMore = true;
      let totalGross = 0;
      let totalNet = 0;
      let payrollCounter = 0;

      const batch = await PayrollBatch.create(
        {
          batchId,
          payPeriod,
          totalGross,
          totalNet,
          recordCount: payrollCounter,
          createdBy: makerId,
          companyId,
          status: 'PENDING_APPROVAL',
        },
        { transaction },
      );

      while (hasMore) {
        const activeEmployees = await EmployeeRepository.activeEmployeesCompensation({ rows: CHUNK_SIZE, page, companyId });

        if (page === 1 && activeEmployees.length === 0) {
          throw ApiError.badRequest('No active employee found. Kindly create employees and try again.');
        }

        if (!activeEmployees?.length) {
          break;
        }

        const {
          payrollData,
          totalGross: chunkGross,
          totalNet: chunkNet,
        } = await this.processChunk({ activeEmployees, payPeriod, batchId, pensionRate, transaction, companyId });

        totalGross += chunkGross;
        totalNet += chunkNet;
        payrollCounter += payrollData.length;

        if (activeEmployees.length < CHUNK_SIZE) hasMore = false;
        page++;
      }

      await batch.update({ totalGross, totalNet, recordCount: payrollCounter }, { transaction });

      return batch;
    });
  };

  private static readonly checkApproval = (batch: PayrollBatch, checkerId: number) => {
    if (batch.createdBy === checkerId) throw ApiError.badRequest('Maker-Checker Violation: Initiator cannot approve.');
    if (batch.status !== 'PENDING_APPROVAL') throw ApiError.badRequest('Batch is not pending approval.');
  };

  static readonly approveBatch = async ({ id, checkerId, approverNote }: ReviewBatchProp) => {
    const batch = await PayrollBatch.findByPk(id);

    if (!batch) throw ApiError.notFound('Payroll batch not found.');

    this.checkApproval(batch, checkerId);

    return await db.transaction(async (transaction) => {
      await batch.update(
        {
          status: 'APPROVED',
          reviewedBy: checkerId,
          approvalDate: new Date(),
          approverNote,
        },
        { transaction },
      );
      return Payroll.update({ status: 'APPROVED' }, { where: { batchId: batch.batchId }, transaction });
    });
  };

  static readonly rejectBatch = async ({ id, checkerId, approverNote }: ReviewBatchProp) => {
    const batch = await PayrollBatch.findByPk(id);

    if (!batch) throw ApiError.notFound('Payroll batch not found.');

    this.checkApproval(batch, checkerId);

    return await db.transaction(async (transaction) => {
      await batch.update(
        {
          status: 'REJECTED',
          reviewedBy: checkerId,
          approvalDate: new Date(),
          approverNote,
        },
        { transaction },
      );
      return Payroll.destroy({ where: { batchId: batch.batchId }, transaction });
    });
  };
}
