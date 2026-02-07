import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { MailUtil } from '../../utils/mail.util';
import { AuthUtil } from '../authentication/auth.utils';
import { UserRepository } from '../users/user.repository';
import { EmployeeChangeRequest } from './employee-change-request.model';
import { EmployeeDraft } from './employee-draft.model';
import { Employee } from './employee.model';
import { EmployeeRepository, ReadAllProps } from './employee.repository';
import config from 'config';

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
        throw ApiError.conflict('There is an existing maintenance on this record. Kindly clear the maintenance and try again');
      }

      const employeeExistingData = await EmployeeRepository.readById(employeeId);

      if (!employeeExistingData) {
        throw ApiError.notFound('Employee not found');
      }

      employeeExistingData.update({ status: 'PENDING_APPROVAL' }, { silent: true });

      const shouldUpdateTerminationDate =
        employeeExistingData.status?.toUpperCase() !== 'TERMINATED' && payload?.status?.toUpperCase() === 'TERMINATED';

      if (shouldUpdateTerminationDate) {
        payload = { ...payload, terminationDate: new Date() };
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
          previousStatus: employeeExistingData.status,
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

      if (employee?.shouldCreateUser) {
        shouldCreateUser = true;
        const password = await AuthUtil.hashPassword(AuthUtil.generatePassword());
        await UserRepository.create(
          {
            ...employee,
            status: 'ACTIVE',
            password,
          },
          t,
        );
      }
    });

    if (request.actionType === 'CREATE' && shouldCreateUser) {
      // Send profile creation request
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

      const draft = await EmployeeDraft.findOne({ where: { requestId } });

      if (!draft?.previousStatus) {
        throw ApiError.internalServerError('Could not complete this request. Kindly contact the system administrator');
      }

      await Employee.update(
        { status: draft.previousStatus },
        { where: { id: request.employeeId }, fields: ['status'], silent: true, transaction: t },
      );
    });
  };
}
