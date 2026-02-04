import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { EmployeeFieldChange } from './employee-field-change.model';
import { Employee } from './employee.model';
import { EmployeeRepository, ReadAllProps } from './employee.repository';
import { EmployeeUtils } from './employee.utils';

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

  static readonly submitNewEmployeeRequest = async (makerId: number, employeeData: any) => {
    return await db.transaction(async (transaction) => {
      const employee = await EmployeeRepository.create(
        {
          ...employeeData,
          status: 'pending_approval',
          createdBy: makerId,
        },
        transaction,
      );

      const request = await EmployeeRepository.createModificationRequest(
        {
          employeeId: employee.id,
          requestedBy: makerId,
          actionType: 'CREATE',
          status: 'PENDING_APPROVAL',
          makerComment: 'New employee creation request',
          createdAt: new Date(),
        },
        transaction,
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reason, ...actualData } = employeeData;

      const fieldChanges = Object.keys(actualData).map((key) => ({
        requestId: request.id,
        fieldName: key,
        oldValue: '',
        newValue: actualData[key].new === null ? null : String(actualData[key].new),
      }));

      await EmployeeFieldChange.bulkCreate(fieldChanges, { transaction });

      return request;
    });
  };

  static readonly submitEmployeeChangeRequest = async (employeeId: number, makerId: number, updateBody: any) => {
    const currentEmployee = await Employee.findByPk(employeeId);

    if (!currentEmployee) {
      throw ApiError.notFound('Employee not found');
    }

    if (currentEmployee.status === 'PENDING_APPROVAL') {
      throw ApiError.badRequest(
        'There is a pending maintenance on this record. Kindly clear the maintenance and before trying again.',
      );
    }

    const deltas = EmployeeUtils.getDelta(currentEmployee.get({ plain: true }), updateBody);
    if (deltas.length === 0) throw ApiError.badRequest('No changes detected.');

    return await db.transaction(async (transaction) => {
      const request = await EmployeeRepository.createModificationRequest(
        {
          employeeId: updateBody.id,
          requestedBy: makerId,
          status: 'PENDING_APPROVAL',
          actionType: 'UPDATE',
          makerComment: updateBody.reason ?? null,
          createdAt: new Date(),
        },
        transaction,
      );

      const fieldChanges = deltas.map((d) => ({ ...d, requestId: request.id }));
      await EmployeeFieldChange.bulkCreate(fieldChanges, { transaction });

      await Employee.update({ ...currentEmployee, status: 'PENDING_APPROVAL' }, { where: { id: updateBody.id }, silent: true });

      return request;
    });
  };

  static readonly processModification = async (requestId: number, checkerId: number, action: 'APPROVE' | 'REJECT') => {
    const request = await EmployeeRepository.findRequestById(requestId);

    if (!request || request.status !== 'PENDING_APPROVAL') {
      throw ApiError.notFound('Modification request not found or already processed.');
    }

    if (request.requestedBy === checkerId) {
      throw ApiError.badRequest('Maker-Checker violation: You cannot process your own request.');
    }

    // If old status = null, use active
    // If new value is not the same as old value, use new value,
    // else use old value
    // const newStatus =
    return await db.transaction(async (t) => {
      if (action === 'REJECT') {
        return EmployeeRepository.updateRequestStatus(requestId, 'REJECTED', checkerId, t);
      }

      const updatePayload: any = {};
      request.fieldChanges.forEach((change: any) => {
        const sanitizedValue = change.newValue === 'null' || change.newValue === '' ? null : change.newValue;
        updatePayload[change.fieldName] = sanitizedValue;
        updatePayload.status = 'ACTIVE';
      });

      await Employee.update(updatePayload, {
        where: { id: request.employeeId },
        transaction: t,
      });

      return EmployeeRepository.updateRequestStatus(requestId, 'APPROVED', checkerId, t);
    });
  };
}
