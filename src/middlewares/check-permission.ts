import { PermissionRepository } from "../features/permission/permission.repository";
import { ApiError } from "../utils/api-error";
import { logger } from "../utils/logger";

const hasRequiredPermission = (requiredPermission) => {
  return async (req, res, next) => {
    logger.debug(`Checking required permission: ${req.requestId}: ${requiredPermission}`);
    try {
      const requiredPermissionObject = await PermissionRepository.getPermissionByName(requiredPermission);

      if (!requiredPermissionObject) {
        throw ApiError.internalServerError("Missing permission maintenance.");
      }

      const userHasRequiredPermission = req.body.authenticatedUser?.permissions.includes(requiredPermissionObject.id);

      if (!userHasRequiredPermission) {
        throw ApiError.forbidden("You are not authorized to perform this action");
      }

      next();
    } catch (error) {
      logger.error(req.requestId + ": Checking permission failed");
      next(error);
    }
  };
};

export { hasRequiredPermission };
