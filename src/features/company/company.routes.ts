import { Router } from "express";
import { hasRequiredRole } from "../../middlewares/check-permission";
import { validateAuthToken } from "../authentication/auth.middleware";
import { CompanyController } from "./company.controller";
import { validateCreateCompany, validateUpdateCompany } from "./company.validators";

const router = Router();

router.post("/", validateAuthToken, hasRequiredRole("ADMIN"), validateCreateCompany, CompanyController.create);
router.get("/:id", validateAuthToken, hasRequiredRole("ADMIN"), CompanyController.getById);
router.get("/", validateAuthToken, hasRequiredRole("ADMIN"), CompanyController.get);
router.put("/:id", validateAuthToken, hasRequiredRole("ADMIN"), validateUpdateCompany, CompanyController.update);
router.delete("/:id", validateAuthToken, hasRequiredRole("ADMIN"), CompanyController.delete);

export { router as companyRouter };
