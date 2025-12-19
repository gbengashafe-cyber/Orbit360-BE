import { RoleRepository } from "../features/role/role.repository";
import { ApiError } from "../utils/api-error";
import { logger } from "../utils/logger";

const hasRequiredRole = (requiredRole) => {
  return async (req, res, next) => {
    logger.debug(`Checking required role: ${req.requestId}: ${requiredRole}`);
    try {
      const requiredRoleObject = await RoleRepository.getRoleByName(requiredRole);

      if (!requiredRoleObject) {
        throw ApiError.internalServerError("Missing role maintenance.");
      }

      const userHasRequiredRole = req.body.authenticatedUser?.role === requiredRoleObject.id;

      if (!userHasRequiredRole) {
        throw ApiError.forbidden("You are not authorized to perform this action");
      }

      next();
    } catch (error) {
      logger.error(req.requestId + ": Checking role failed");
      next(error);
    }
  };
};

export { hasRequiredRole };
