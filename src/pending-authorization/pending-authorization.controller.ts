import { listRequests } from '../features/staff-movement/staff-movement.requests';
import { Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response';
import { AuthorizationService } from './pending-authorization.service';
import { ApiError } from '../utils/api-error';

export class AuthorizationController {
  static readonly getDashboard = async (req: Request, res: Response) => {
    const { page, rows } = req.pagination;

    const result = await AuthorizationService.getGroupedPending(page, rows);
    res.json(ApiResponse({ ...result, message: '' }));
  };

  static readonly getCounts = async (req: Request, res: Response) => {
    const permissions = req.user?.permissions || [];
    const userId = req.user?.id as number;
    const userEmployeeId = req.user?.employeeRecord?.id as number;

    const data = await AuthorizationService.getBadgeCounts(permissions, userId, userEmployeeId);

    if (userEmployeeId && permissions.some((p) => ['REVIEW_STAFF_MOVEMENT', 'APPROVE_STAFF_MOVEMENT'].includes(p))) {
      try {
        const queue = await listRequests(userId, { view: 'assigned', page: 1, rows: 1 });
        Object.assign(data.breakdown, { staffMovement: queue.total });
        data.total += queue.total;
      } catch (error) {
        if (!(error instanceof ApiError && error.code === 403)) throw error;
      }
    }
    return res.json(ApiResponse({ data }));
  };

  static readonly getModulePending = async (req: Request, res: Response) => {
    const { moduleName } = req.params;
    const { page, rows } = req.pagination;
    const userId = req.user?.id as number;
    const userEmployeeId = req.user?.employeeRecord?.id as number;
    const supervisorId = userEmployeeId;

    if (moduleName.toUpperCase() === 'STAFF MOVEMENT') {
      const result = await listRequests(userId, { view: 'assigned', page, rows });
      return res.json(
        ApiResponse({
          data: result.rows,
          pagination: { page, rows, total: result.total, pages: Math.ceil(result.total / rows) },
        }),
      );
    }
    if (!['LEAVES', 'TRAINING REQUESTS'].includes(moduleName.toLocaleUpperCase())) {
      hasModuleApprovalPermission({ moduleName, req });
    }

    const result = await AuthorizationService.getPendingModuleItems({
      moduleName,
      page,
      rows,
      userId,
      userEmployeeId,
      supervisorId,
      canApproveTraining: req.user?.permissions?.includes('APPROVE_TRAINING_REQUESTS') ?? false,
    });

    return res.json(
      ApiResponse({
        message: `Pending ${moduleName} items retrieved`,
        ...result,
      }),
    );
  };
}

const hasModuleApprovalPermission = ({ moduleName, req }) => {
  const requiredPermission = `APPROVE_${moduleName.split(' ').join('_').toUpperCase()}`;

  const hasPermission = req.user?.permissions?.includes(requiredPermission);

  if (!hasPermission) {
    throw ApiError.forbidden(`You do not have permission to approve ${moduleName}.`);
  }
};
