import { Router } from 'express';
import { isInAllowedDepartment } from '../../../utils/check-permission';
import { validateAuthToken } from '../../authentication/auth.middleware';
import { PayrollReportController } from './payroll-report.controller';
import { uploadReport } from './payroll-report.middleware';
import { validatePayrollReport } from './payroll-report.validators';

const router = Router();

/**
 * @route   POST /api/payroll-reports
 * @desc    Upload a new payroll Excel report
 * @access  Private (HR/Finance)
 */
router.post(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  uploadReport.single('reportFile'),
  validatePayrollReport,
  PayrollReportController.create,
);

/**
 * @route   GET /api/payroll-reports
 * @desc    Get all payroll reports with pagination
 * @access  Private
 */
router.get('/', validateAuthToken, PayrollReportController.getAll);

/**
 * @route   DELETE /api/payroll-reports/:id
 * @desc    Delete a payroll report and its physical file
 * @access  Private (Admin/HR)
 */
router.delete('/:id', validateAuthToken, isInAllowedDepartment(['HR']), PayrollReportController.delete);

export { router as payrollReportRoutes };
