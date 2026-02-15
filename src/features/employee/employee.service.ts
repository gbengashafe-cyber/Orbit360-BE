import config from 'config';
import { addMonths, differenceInMonths, endOfMonth, getMonth, getYear } from 'date-fns';
import { CreationAttributes } from 'sequelize';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { MailUtil } from '../../utils/mail.util';
import { AuthUtil } from '../authentication/auth.utils';
import { LoanType } from '../loans/loan-types/loan-types.model';
import { Loan } from '../loans/loan.model';
import { LoanRepository } from '../loans/loan.repository';
import { calculatePayroll } from '../payroll/payroll.utils';
import { UserRepository } from '../users/user.repository';
import { userSchema } from '../users/user.validation';
import { EmployeeChangeRequest } from './employee-change-request.model';
import { EmployeeDraft } from './employee-draft.model';
import { Employee } from './employee.model';
import { EmployeeRepository, ReadAllProps } from './employee.repository';

export class EmployeeService {
  static readonly getDirectory = async ({ page, rows, filters }: ReadAllProps) => {
    const { count, rows: data } = await EmployeeRepository.findActiveDirectory({ page, rows, filters });

    return {
      data,
      pagination: {
        total: count,
        page,
        rows,
        pages: Math.ceil(count / rows),
      },
    };
  };

  static readonly initiateEmployeeCreation = async (payload: any, makerId: number) => {
    return await db.transaction(async (t) => {
      // Create employee in master table
      const employee = await EmployeeRepository.create({ ...payload, createdBy: makerId }, t);

      // Create change/creation request record
      const request = await EmployeeChangeRequest.create(
        {
          employeeId: employee.id,
          requestedBy: makerId,
          actionType: 'CREATE',
        },
        { transaction: t },
      );

      // Create draft record
      await EmployeeDraft.create(
        {
          ...employee.get({ plain: true }),
          previousStatus: 'CANCELLED',
          id: undefined,
          requestId: request.id,
          status: 'ACTIVE',
        },
        { transaction: t },
      );

      return request.id;
    });
  };

  static readonly initiateEmployeeMaintenance = async ({
    employeeId,
    payload,
    makerId,
  }: {
    employeeId: number;
    payload: any;
    makerId: number;
  }) => {
    return await db.transaction(async (t) => {
      const pendingMaintenance = await EmployeeChangeRequest.findOne({ where: { employeeId, status: 'PENDING_APPROVAL' } });

      if (pendingMaintenance) {
        throw ApiError.conflict(
          `You can't edit this employee's record while an approval request is in progress. Please wait until the review is completed`,
        );
      }

      const employeeExistingData = await EmployeeRepository.readById(employeeId);

      if (!employeeExistingData) {
        throw ApiError.notFound('Employee not found');
      }

      const previousStatus = employeeExistingData.status;
      employeeExistingData.update({ status: 'PENDING_APPROVAL' }, { silent: true });

      const shouldUpdateTerminationDate =
        employeeExistingData.status?.toUpperCase() !== 'TERMINATED' && payload?.status?.toUpperCase() === 'TERMINATED';

      if (shouldUpdateTerminationDate) {
        payload = { ...payload, terminationDate: new Date() };
        // Revoke user access
        const employeeUserRecord = await UserRepository.readByEmail(employeeExistingData.email);
        await UserRepository.update(employeeUserRecord?.id, { status: 'INACTIVE' });
      }

      const request = await EmployeeChangeRequest.create(
        {
          employeeId,
          requestedBy: makerId,
          actionType: 'UPDATE',
        },
        { transaction: t },
      );

      await EmployeeDraft.create(
        {
          ...employeeExistingData.get({ plain: true }),
          ...payload,
          id: undefined,
          requestId: request.id,
          previousStatus,
        },
        { transaction: t },
      );

      return request;
    });
  };

  static readonly approveMaintenance = async (requestId: number, checkerId: number, reason: string) => {
    if (!requestId) {
      throw ApiError.notFound('Request ID not provided');
    }

    const request = await EmployeeChangeRequest.findByPk(requestId);

    if (!request || request.status !== 'PENDING_APPROVAL') {
      throw ApiError.notFound('Modification request not found or already processed.');
    }

    if (request.requestedBy === checkerId) {
      throw ApiError.badRequest('Maker-Checker violation: You cannot approve/reject your own request.');
    }

    let employeeEmail: string = '',
      shouldCreateUser = false;

    await db.transaction(async (t) => {
      await request.update(
        {
          status: 'APPROVED',
          reviewedBy: checkerId,
          reviewerComment: reason || 'Approved by checker',
        },
        { transaction: t },
      );

      const draft = await EmployeeDraft.findOne({ where: { requestId }, transaction: t });

      if (!draft) {
        throw ApiError.internalServerError('Unable to process the request. Kindly contact the system administrator');
      }

      employeeEmail = draft.email;

      const updatePayload = draft.get({ plain: true });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...fieldsToUpdate } = updatePayload;

      if (request.actionType === 'CREATE') {
        (fieldsToUpdate as any).approvedBy = checkerId;
      }

      await Employee.update(fieldsToUpdate, { where: { id: request.employeeId }, silent: true, transaction: t });
      const employee = await Employee.findByPk(request.employeeId, { transaction: t });

      const employeeUserRecord = await UserRepository.readByEmail(employee?.email as string);
      if (request.actionType === 'UPDATE' && employeeUserRecord) {
        await employeeUserRecord.update(
          {},
          { fields: ['email', 'firstName', 'lastName', 'jobRole', 'departmentName'], transaction: t },
        );
      }

      if (request.actionType === 'CREATE' && employee?.shouldCreateUser) {
        shouldCreateUser = true;

        const userValidatedDetails = userSchema.parse({ ...employee.get({ plain: true }), role: 'user' });
        const password = await AuthUtil.hashPassword(AuthUtil.generatePassword());
        await UserRepository.create(
          {
            ...userValidatedDetails,
            status: 'ACTIVE',
            password,
            profileImage: '',
          },
          t,
        );
      }
    });

    if (request.actionType === 'CREATE' && shouldCreateUser) {
      MailUtil.sendMail({
        to: employeeEmail,
        subject: `Welcome Aboard!`,
        body: `
        <h3>Welcome aboard!</h3>
        <p>An employee account has been created for you on the Orbit360 platform.</p>
        <p>You can access the Employee Self-Service Portal by logging in to <a href="${config.get('mail.frontendURL')}">orbit360</a> with your staff credentials.</p>
        <p>Your portal provides access to tools for leave management, performance appraisals, and more.</p>
        <p>If you have any questions, please contact the HR department.</p>`,
      });
    }
  };

  static readonly rejectMaintenance = async (requestId: number, checkerId: number, reason: string) => {
    if (!requestId) {
      throw ApiError.notFound('Request ID not provided');
    }

    const request = await EmployeeChangeRequest.findByPk(requestId);

    if (!request || request.status !== 'PENDING_APPROVAL') {
      throw ApiError.notFound('Modification request not found or already processed.');
    }

    if (request.requestedBy === checkerId) {
      throw ApiError.badRequest('Maker-Checker violation: You cannot approve/reject your own request.');
    }

    return await db.transaction(async (t) => {
      await request.update(
        {
          status: 'REJECTED',
          reviewedBy: checkerId,
          reviewerComment: reason || 'Rejected by checker',
        },
        { transaction: t },
      );

      const draft = await EmployeeDraft.findOne({ where: { requestId }, transaction: t });

      if (!draft?.previousStatus) {
        throw ApiError.internalServerError('Could not complete this request. Kindly contact the system administrator');
      }

      await Employee.update(
        { status: draft.previousStatus },
        { where: { id: request.employeeId }, fields: ['status'], silent: true, transaction: t },
      );
    });
  };

  static readonly createLoanRequest = async ({ employeeId, loan }: { employeeId: number; loan: CreationAttributes<Loan> }) => {
    const employee = await EmployeeRepository.readById(employeeId);

    if (!employee) {
      throw ApiError.badRequest('Employee record not found');
    }

    if (['PENDING_APPROVAL'].includes(employee.status)) {
      throw ApiError.badRequest(
        'There is an ongoing maintenance on this employee record. Kindly clear the pending maintenance and try again.',
      );
    }

    if (!['ACTIVE', 'ON_LEAVE'].includes(employee.status)) {
      throw ApiError.badRequest('Only active employees are allowed to initiate loan requests');
    }

    if (differenceInMonths(new Date(), employee.hireDate) < 6) {
      throw ApiError.badRequest('Only employees that have spent minimum of six (6) months are allowed to initiate loan requests');
    }

    const loanTypeConfiguration = await LoanType.findByPk(loan.loanTypeId);

    if (!loanTypeConfiguration) {
      throw ApiError.badRequest('Missing configuration for the loan type selected. Kindly contact the system administrator');
    }

    // Thrift can only last till the end of a cycle, which is June and December
    if (loanTypeConfiguration.name.toUpperCase() === 'THRIFT') {
      const endDate = addMonths(loan.startDate, loan.tenureMonths);

      const year = getYear(loan.startDate);
      const month = getMonth(loan.startDate);

      const cycleEnd = month <= 5 ? endOfMonth(new Date(year, 5)) : endOfMonth(new Date(year, 11));

      if (endDate > cycleEnd) {
        throw ApiError.badRequest(`${loanTypeConfiguration.name} loan tenure cannot extend beyond the end of the current cycle`);
      }
    }

    if (loan.tenureMonths > loanTypeConfiguration.maxTenureMonths) {
      throw ApiError.badRequest(
        `${loanTypeConfiguration.name} loan cannot be more than ${loanTypeConfiguration.maxTenureMonths} months`,
      );
    }

    if (loanTypeConfiguration.name?.toUpperCase() === 'SALARY ADVANCE') {
      const activeLoans = await LoanRepository.readEmployeesActiveLoans([employeeId]);

      // Check that salary advance is not more than monthly net monthly pay
      const payrollCalculations = calculatePayroll({
        employee,
        activeLoans: activeLoans,
        payPeriod: '2025-01',
        pensionRate: 0.08,
      });

      const maxAmount = 0.5 * payrollCalculations.netSalary;
      if (loan.principalAmount > maxAmount) {
        throw ApiError.badRequest('Salary advance cannot be more than 50% of monthly net');
      }
    }
    return LoanRepository.create({ ...loan, employeeId, interestRate: loanTypeConfiguration.interestRate });
  };

  static readonly cancelLoanRequest = async ({ employeeId, loanId }: { employeeId: number; loanId: number }) => {
    const loanRecord = await LoanRepository.readById(loanId);

    if (!loanRecord) {
      throw ApiError.notFound('Loan record not found');
    }

    if (!['PENDING_APPROVAL', 'PENDING_REVIEW'].includes(loanRecord.status.toUpperCase())) {
      throw ApiError.forbidden('This loan cannot be cancelled.');
    }

    if (loanRecord.employeeId !== employeeId) {
      throw ApiError.forbidden('You are not permitted to perform this activity');
    }

    return Loan.update({ status: 'CANCELLED' }, { where: { id: loanId } });
  };

  static readonly getLoans = ({ employeeId, rows, page }) => {
    return LoanRepository.read({ rows, page, filters: { employeeId } });
  };
}
