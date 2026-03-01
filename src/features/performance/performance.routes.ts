import { Router } from 'express';
import { PerformanceDashboardController, GoalController, AppraisalController } from './performance.controller';
import {
  validateCreateGoal,
  validateUpdateGoal,
  validateUpdateGoalProgress,
  validateGoalIdParam,
  validateCreateAppraisalCycle,
  validateUpdateAppraisalCycle,
  validateAppraisalCycleIdParam,
  validateSubmitAppraisal,
  validateReviewAppraisal,
  validateUpdateAppraisal,
  validateAppraisalIdParam,
} from './performance.validators';

const router = Router();

// ============ Performance Dashboard ============
router.get('/dashboard', PerformanceDashboardController.getDashboard);

// ============ Goals ============
router.get('/goals', GoalController.getAll);
router.get('/goals/:id', validateGoalIdParam, GoalController.getById);
router.post('/goals', validateCreateGoal, GoalController.create);
router.put('/goals/:id', validateGoalIdParam, validateUpdateGoal, GoalController.update);
router.patch('/goals/:id/progress', validateGoalIdParam, validateUpdateGoalProgress, GoalController.updateProgress);
router.delete('/goals/:id', validateGoalIdParam, GoalController.delete);

// ============ Appraisal Cycles ============
router.get('/cycles', AppraisalController.getAllCycles);
router.get('/cycles/:id', validateAppraisalCycleIdParam, AppraisalController.getCycleById);
router.post('/cycles', validateCreateAppraisalCycle, AppraisalController.createCycle);
router.put('/cycles/:id', validateAppraisalCycleIdParam, validateUpdateAppraisalCycle, AppraisalController.updateCycle);
router.post('/cycles/:id/activate', validateAppraisalCycleIdParam, AppraisalController.activateCycle);
router.post('/cycles/:id/close', validateAppraisalCycleIdParam, AppraisalController.closeCycle);

// ============ Appraisals ============
router.get('/appraisals', AppraisalController.getAppraisals);
router.get('/appraisals/:id', validateAppraisalIdParam, AppraisalController.getAppraisalById);
router.post('/appraisals', validateSubmitAppraisal, AppraisalController.submitAppraisal);
router.put('/appraisals/:id', validateAppraisalIdParam, validateUpdateAppraisal, AppraisalController.updateAppraisal);
router.post('/appraisals/:id/submit', validateAppraisalIdParam, AppraisalController.submitForReview);
router.post('/appraisals/:id/review', validateAppraisalIdParam, validateReviewAppraisal, AppraisalController.reviewAppraisal);
router.delete('/appraisals/:id', validateAppraisalIdParam, AppraisalController.deleteAppraisal);

export const performanceRoutes = router;
