import { Router } from "express";
import { hasRequiredPermission } from "../../middlewares/check-permission";
import { validateAuthToken } from "../authentication/auth.middleware";
import { CompanyController } from "./company.controller";
import { validateCompany } from "./company.validators";

const router = Router();

router.post("/", validateAuthToken, hasRequiredPermission("CREATE_COMPANY"), validateCompany, CompanyController.create);
router.get("/:id", validateAuthToken, hasRequiredPermission("READ_COMPANY"), CompanyController.getById);
router.get("/", validateAuthToken, hasRequiredPermission("LIST_COMPANIES"), CompanyController.get);

export { router as companyRoutes };
