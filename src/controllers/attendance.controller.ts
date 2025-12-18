import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import { Attendance, Employee } from "../models";
import { ApiError } from "../utils/api-error";
import { logger } from "../utils/logger";

export class AttendanceController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.body.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: attendances } = await Attendance.findAndCountAll({
        limit: rows,
        offset,
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
        order: [["date", "DESC"]],
      });

      res.json({
        data: attendances,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching attendance: ${error}`);
      next(error);
    }
  }

  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { page, rows } = req.body.pagination;
      const { startDate, endDate } = req.query;
      const offset = (page - 1) * rows;

      const whereClause: any = { employeeId };

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date[Op.gte] = new Date(startDate as string);
        if (endDate) whereClause.date[Op.lte] = new Date(endDate as string);
      }

      const { count, rows: attendances } = await Attendance.findAndCountAll({
        where: whereClause,
        limit: rows,
        offset,
        order: [["date", "DESC"]],
      });

      res.json({
        data: attendances,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching employee attendance: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const attendance = await Attendance.findByPk(id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      if (!attendance) {
        throw ApiError.notFound("Attendance record not found");
      }

      res.json({ data: attendance });
    } catch (error) {
      logger.error(`Error fetching attendance: ${error}`);
      next(error);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.body;
      const today = new Date().toISOString().split("T")[0];

      let attendance = await Attendance.findOne({
        where: {
          employeeId,
          date: today,
        },
      });

      if (!attendance) {
        attendance = await Attendance.create({
          employeeId,
          date: today,
          checkIn: new Date(),
          status: "present",
        });
      } else if (!attendance.checkIn) {
        await attendance.update({ checkIn: new Date() });
      }

      res.json({ data: attendance, message: "Checked in successfully" });
    } catch (error) {
      logger.error(`Error during check-in: ${error}`);
      next(error);
    }
  }

  static async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.body;
      const today = new Date().toISOString().split("T")[0];

      const attendance = await Attendance.findOne({
        where: {
          employeeId,
          date: today,
        },
      });

      if (!attendance) {
        throw ApiError.notFound("No check-in record found for today");
      }

      await attendance.update({ checkOut: new Date() });

      res.json({ data: attendance, message: "Checked out successfully" });
    } catch (error) {
      logger.error(`Error during check-out: ${error}`);
      next(error);
    }
  }

  static async markAbsent(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, date } = req.body;

      let attendance = await Attendance.findOne({
        where: {
          employeeId,
          date,
        },
      });

      if (!attendance) {
        attendance = await Attendance.create({
          employeeId,
          date,
          status: "absent",
        });
      } else {
        await attendance.update({ status: "absent" });
      }

      res.json({ data: attendance, message: "Marked as absent" });
    } catch (error) {
      logger.error(`Error marking absent: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const attendance = await Attendance.findByPk(id);
      if (!attendance) {
        throw ApiError.notFound("Attendance record not found");
      }

      await attendance.destroy();

      res.json({ message: "Attendance record deleted" });
    } catch (error) {
      logger.error(`Error deleting attendance: ${error}`);
      next(error);
    }
  }
}
