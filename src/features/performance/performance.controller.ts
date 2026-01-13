import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Goal } from './goal.model';
import { AppraisalCycle, Appraisal } from './appraisal.model';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';

// ============ Performance Dashboard Controller ============
export class PerformanceDashboardController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { employee_id } = req.query;

      // Get active appraisal cycles
      const activeAppraisalCycles = await AppraisalCycle.count({
        where: { status: ['active', 'review'] },
      });

      // Get pending appraisals
      const pendingAppraisals = await Appraisal.count({
        where: { status: 'pending' },
      });

      // Get completed appraisals this year
      const currentYear = new Date().getFullYear();
      const completedAppraisals = await Appraisal.count({
        where: {
          status: 'reviewed',
          reviewed_date: {
            [Op.gte]: new Date(`${currentYear}-01-01`),
            [Op.lt]: new Date(`${currentYear + 1}-01-01`),
          },
        },
      });

      // Get active goals
      let activeGoalsQuery: any = { status: ['in_progress', 'not_started'] };
      if (employee_id) {
        activeGoalsQuery.employee_id = employee_id;
      }

      const activeGoals = await Goal.count({
        where: activeGoalsQuery,
      });

      // Get average goal completion percentage
      let goalStats;
      if (employee_id && typeof employee_id === 'string' && !isNaN(Number(employee_id))) {
        goalStats = await Goal.findAll({
          attributes: [['AVG(completion_percentage)', 'avg_completion']],
          where: { employee_id: Number(employee_id) },
          raw: true,
        });
      } else if (!employee_id) {
        goalStats = await Goal.findAll({
          attributes: [['AVG(completion_percentage)', 'avg_completion']],
          raw: true,
        });
      } else {
        //Noticee fallback: invalid employee_id type, treat as no match
        goalStats = [{ avg_completion: 0 }];
      }

      const avgGoalCompletion = goalStats[0]?.['avg_completion'] || 0;

      // Get average appraisal rating this year
      const ratingStats = await Appraisal.findAll({
        attributes: [['AVG(overall_rating)', 'avg_rating']],
        where: {
          status: 'reviewed',
          reviewed_date: {
            [Op.gte]: new Date(`${currentYear}-01-01`),
            [Op.lt]: new Date(`${currentYear + 1}-01-01`),
          },
        },
        raw: true,
      });

      const avgAppraisalRating = ratingStats[0]?.['avg_rating'] || 0;

      res.json({
        data: {
          activeAppraisalCycles,
          pendingAppraisals,
          completedAppraisals,
          activeGoals,
          avgGoalCompletion: parseFloat(avgGoalCompletion.toFixed(2)),
          avgAppraisalRating: parseFloat(avgAppraisalRating.toFixed(2)),
        },
      });
    } catch (error) {
      logger.error(`Error fetching performance dashboard: ${error}`);
      next(error);
    }
  }
}

// ============ Goals Controller ============
export class GoalController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, rows = 10 } = req.pagination || {};
      const offset = ((page as number) - 1) * (rows as number);
      const { status, employee_id } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (employee_id) whereClause.employee_id = employee_id;

      const { count, rows: goals } = await Goal.findAndCountAll({
        where: whereClause,
        limit: rows as number,
        offset,
        order: [['end_date', 'ASC']],
      });

      res.json({
        data: goals,
        pagination: { total: count, page, rows, pages: Math.ceil(count / (rows as number)) },
      });
    } catch (error) {
      logger.error(`Error fetching goals: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const goal = await Goal.findByPk(id);

      if (!goal) throw ApiError.notFound('Goal not found');
      res.json({ data: goal });
    } catch (error) {
      logger.error(`Error fetching goal: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { employee_id, title, description, target_value, start_date, end_date, assigned_by } = req.body;

      const goal = await Goal.create({
        employee_id,
        title,
        description,
        target_value,
        current_progress: 0,
        status: 'not_started',
        start_date,
        end_date,
        assigned_by,
        completion_percentage: 0,
      });

      res.status(201).json({ data: goal, message: 'Goal created successfully' });
    } catch (error) {
      logger.error(`Error creating goal: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const goal = await Goal.findByPk(id);

      if (!goal) throw ApiError.notFound('Goal not found');

      await goal.update(req.body);
      res.json({ data: goal, message: 'Goal updated successfully' });
    } catch (error) {
      logger.error(`Error updating goal: ${error}`);
      next(error);
    }
  }

  static async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { current_progress, completion_percentage, status } = req.body;
      const goal = await Goal.findByPk(id);

      if (!goal) throw ApiError.notFound('Goal not found');

      await goal.update({
        current_progress: current_progress ?? goal.current_progress,
        completion_percentage: completion_percentage ?? goal.completion_percentage,
        status: status ?? goal.status,
      });

      res.json({ data: goal, message: 'Goal progress updated successfully' });
    } catch (error) {
      logger.error(`Error updating goal progress: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const goal = await Goal.findByPk(id);

      if (!goal) throw ApiError.notFound('Goal not found');

      await goal.destroy();
      res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting goal: ${error}`);
      next(error);
    }
  }
}

// ============ Appraisal Controller ============
export class AppraisalController {
  static async getAllCycles(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, rows = 10 } = req.pagination || {};
      const offset = ((page as number) - 1) * (rows as number);
      const { status, department } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (department) whereClause.department = department;

      const { count, rows: cycles } = await AppraisalCycle.findAndCountAll({
        where: whereClause,
        limit: rows as number,
        offset,
        order: [['start_date', 'DESC']],
      });

      res.json({
        data: cycles,
        pagination: { total: count, page, rows, pages: Math.ceil(count / (rows as number)) },
      });
    } catch (error) {
      logger.error(`Error fetching appraisal cycles: ${error}`);
      next(error);
    }
  }

  static async getCycleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cycle = await AppraisalCycle.findByPk(id);

      if (!cycle) throw ApiError.notFound('Appraisal cycle not found');
      res.json({ data: cycle });
    } catch (error) {
      logger.error(`Error fetching appraisal cycle: ${error}`);
      next(error);
    }
  }

  static async createCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { cycle_name, description, start_date, end_date, review_deadline, created_by, department } = req.body;

      const cycle = await AppraisalCycle.create({
        cycle_name,
        description,
        start_date,
        end_date,
        review_deadline,
        status: 'planning',
        created_by,
        department,
      });

      res.status(201).json({ data: cycle, message: 'Appraisal cycle created successfully' });
    } catch (error) {
      logger.error(`Error creating appraisal cycle: ${error}`);
      next(error);
    }
  }

  static async updateCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cycle = await AppraisalCycle.findByPk(id);

      if (!cycle) throw ApiError.notFound('Appraisal cycle not found');

      await cycle.update(req.body);
      res.json({ data: cycle, message: 'Appraisal cycle updated successfully' });
    } catch (error) {
      logger.error(`Error updating appraisal cycle: ${error}`);
      next(error);
    }
  }

  static async activateCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cycle = await AppraisalCycle.findByPk(id);

      if (!cycle) throw ApiError.notFound('Appraisal cycle not found');

      await cycle.update({ status: 'active' });
      res.json({ data: cycle, message: 'Appraisal cycle activated successfully' });
    } catch (error) {
      logger.error(`Error activating appraisal cycle: ${error}`);
      next(error);
    }
  }

  static async closeCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cycle = await AppraisalCycle.findByPk(id);

      if (!cycle) throw ApiError.notFound('Appraisal cycle not found');

      await cycle.update({ status: 'closed' });
      res.json({ data: cycle, message: 'Appraisal cycle closed successfully' });
    } catch (error) {
      logger.error(`Error closing appraisal cycle: ${error}`);
      next(error);
    }
  }

  static async getAppraisals(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, rows = 10 } = req.pagination || {};
      const offset = ((page as number) - 1) * (rows as number);
      const { status, appraisal_cycle_id, employee_id } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (appraisal_cycle_id) whereClause.appraisal_cycle_id = appraisal_cycle_id;
      if (employee_id) whereClause.employee_id = employee_id;

      const { count, rows: appraisals } = await Appraisal.findAndCountAll({
        where: whereClause,
        limit: rows as number,
        offset,
        order: [['submitted_date', 'DESC']],
      });

      res.json({
        data: appraisals,
        pagination: { total: count, page, rows, pages: Math.ceil(count / (rows as number)) },
      });
    } catch (error) {
      logger.error(`Error fetching appraisals: ${error}`);
      next(error);
    }
  }

  static async getAppraisalById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const appraisal = await Appraisal.findByPk(id);

      if (!appraisal) throw ApiError.notFound('Appraisal not found');
      res.json({ data: appraisal });
    } catch (error) {
      logger.error(`Error fetching appraisal: ${error}`);
      next(error);
    }
  }

  static async submitAppraisal(req: Request, res: Response, next: NextFunction) {
    try {
      const { appraisal_cycle_id, employee_id, manager_id, performance_summary, strengths, areas_for_improvement } =
        req.body;

      const appraisal = await Appraisal.create({
        appraisal_cycle_id,
        employee_id,
        manager_id,
        performance_summary,
        strengths,
        areas_for_improvement,
        status: 'in_progress',
        submitted_date: new Date(),
      });

      res.status(201).json({ data: appraisal, message: 'Appraisal submitted successfully' });
    } catch (error) {
      logger.error(`Error submitting appraisal: ${error}`);
      next(error);
    }
  }

  static async updateAppraisal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const appraisal = await Appraisal.findByPk(id);

      if (!appraisal) throw ApiError.notFound('Appraisal not found');

      await appraisal.update(req.body);
      res.json({ data: appraisal, message: 'Appraisal updated successfully' });
    } catch (error) {
      logger.error(`Error updating appraisal: ${error}`);
      next(error);
    }
  }

  static async submitForReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const appraisal = await Appraisal.findByPk(id);

      if (!appraisal) throw ApiError.notFound('Appraisal not found');

      await appraisal.update({ status: 'submitted', submitted_date: new Date() });
      res.json({ data: appraisal, message: 'Appraisal submitted for review' });
    } catch (error) {
      logger.error(`Error submitting appraisal for review: ${error}`);
      next(error);
    }
  }

  static async reviewAppraisal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { overall_rating, goals_achievement } = req.body;
      const appraisal = await Appraisal.findByPk(id);

      if (!appraisal) throw ApiError.notFound('Appraisal not found');

      await appraisal.update({
        overall_rating,
        goals_achievement,
        status: 'reviewed',
        reviewed_date: new Date(),
      });

      res.json({ data: appraisal, message: 'Appraisal reviewed successfully' });
    } catch (error) {
      logger.error(`Error reviewing appraisal: ${error}`);
      next(error);
    }
  }

  static async deleteAppraisal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const appraisal = await Appraisal.findByPk(id);

      if (!appraisal) throw ApiError.notFound('Appraisal not found');

      await appraisal.destroy();
      res.json({ message: 'Appraisal deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting appraisal: ${error}`);
      next(error);
    }
  }
}
