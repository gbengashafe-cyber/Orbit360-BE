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
        newValue: String(actualData[key]),
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

      return request;
    });
  };
}
