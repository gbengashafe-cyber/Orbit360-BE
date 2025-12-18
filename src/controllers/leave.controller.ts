import { NextFunction, Request, Response } from "express";
import { Employee, Leave } from "../models";
import { ApiError } from "../utils/api-error";
import { logger } from "../utils/logger";

export class LeaveController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.body.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: leaves } = await Leave.findAndCountAll({
        limit: rows,
        offset,
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
        order: [["createdAt", "DESC"]],
      });

      res.json({
        data: leaves,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching leaves: ${error}`);
      next(error);
    }
  }

  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { page, rows } = req.body.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: leaves } = await Leave.findAndCountAll({
        where: { employeeId },
        limit: rows,
        offset,
        order: [["createdAt", "DESC"]],
      });

      res.json({
        data: leaves,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching employee leaves: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const leave = await Leave.findByPk(id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      if (!leave) {
        throw ApiError.notFound("Leave request not found");
      }

      res.json({ data: leave });
    } catch (error) {
      logger.error(`Error fetching leave: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, startDate, endDate, type, reason } = req.body;

      const leave = await Leave.create({
        employeeId,
        startDate,
        endDate,
        type,
        reason,
        status: "pending",
      });

      const createdLeave = await Leave.findByPk(leave.id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      res.status(201).json({ data: createdLeave, message: "Leave request created successfully" });
    } catch (error) {
      logger.error(`Error creating leave: ${error}`);
      next(error);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const leave = await Leave.findByPk(id);
      if (!leave) {
        throw ApiError.notFound("Leave request not found");
      }

      await leave.update({ status: "approved" });

      const updatedLeave = await Leave.findByPk(id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      res.json({ data: updatedLeave, message: "Leave request approved" });
    } catch (error) {
      logger.error(`Error approving leave: ${error}`);
      next(error);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const leave = await Leave.findByPk(id);
      if (!leave) {
        throw ApiError.notFound("Leave request not found");
      }

      await leave.update({ status: "rejected" });

      const updatedLeave = await Leave.findByPk(id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      res.json({ data: updatedLeave, message: "Leave request rejected" });
    } catch (error) {
      logger.error(`Error rejecting leave: ${error}`);
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const leave = await Leave.findByPk(id);
      if (!leave) {
        throw ApiError.notFound("Leave request not found");
      }

      await leave.destroy();

      res.json({ message: "Leave request cancelled" });
    } catch (error) {
      logger.error(`Error cancelling leave: ${error}`);
      next(error);
    }
  }
}
