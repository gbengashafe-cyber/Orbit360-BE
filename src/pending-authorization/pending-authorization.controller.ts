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
    const userEmail = req.user?.email as string;

    const data = await AuthorizationService.getBadgeCounts(permissions, userId, userEmail);

    return res.json(ApiResponse({ data }));
  };

  static readonly getModulePending = async (req: Request, res: Response) => {
    const { moduleName } = req.params;
    const { page, rows } = req.pagination;
    const viewerEmail = req.user?.email as string;

    if (!['LEAVES'].includes(moduleName.toLocaleUpperCase())) {
      hasModuleApprovalPermission({ moduleName, req });
    }

    const result = await AuthorizationService.getPendingModuleItems(moduleName, page, rows, viewerEmail);

    return res.json(
      ApiResponse({
        message: `Pending ${moduleName} items retrieved`,
        ...result,
      }),
    );
  };
}

const hasModuleApprovalPermission = ({ moduleName, req }) => {
  const requiredPermission = `APPROVE_${moduleName.toUpperCase()}`;

  const hasPermission = req.user?.permissions?.includes(requiredPermission);

  if (!hasPermission) {
    throw ApiError.forbidden(`You do not have permission to approve ${moduleName}.`);
  }
};
