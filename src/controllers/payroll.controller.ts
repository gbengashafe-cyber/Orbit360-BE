import { NextFunction, Request, Response } from "express";
import { Employee, Payroll } from "../models";
import { ApiError } from "../utils/api-error";
import { logger } from "../utils/logger";

export class PayrollController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.body.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: payrolls } = await Payroll.findAndCountAll({
        limit: rows,
        offset,
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
        order: [["createdAt", "DESC"]],
      });

      res.json({
        data: payrolls,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching payrolls: ${error}`);
      next(error);
    }
  }

  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { page, rows } = req.body.pagination;
      const offset = (page - 1) * rows;

      const { count, rows: payrolls } = await Payroll.findAndCountAll({
        where: { employeeId },
        limit: rows,
        offset,
        order: [
          ["year", "DESC"],
          ["month", "DESC"],
        ],
      });

      res.json({
        data: payrolls,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching employee payroll: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      if (!payroll) {
        throw ApiError.notFound("Payroll record not found");
      }

      res.json({ data: payroll });
    } catch (error) {
      logger.error(`Error fetching payroll: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, month, year, baseSalary, allowances = 0, deductions = 0 } = req.body;

      const netSalary = baseSalary + allowances - deductions;

      const payroll = await Payroll.create({
        employeeId,
        month,
        year,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        status: "pending",
      });

      const createdPayroll = await Payroll.findByPk(payroll.id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      res.status(201).json({ data: createdPayroll, message: "Payroll created successfully" });
    } catch (error) {
      logger.error(`Error creating payroll: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { baseSalary, allowances = 0, deductions = 0 } = req.body;

      const payroll = await Payroll.findByPk(id);
      if (!payroll) {
        throw ApiError.notFound("Payroll record not found");
      }

      const netSalary = (baseSalary || payroll.baseSalary) + allowances - deductions;

      await payroll.update({
        baseSalary,
        allowances,
        deductions,
        netSalary,
      });

      const updatedPayroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      res.json({ data: updatedPayroll, message: "Payroll updated successfully" });
    } catch (error) {
      logger.error(`Error updating payroll: ${error}`);
      next(error);
    }
  }

  static async markProcessed(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const payroll = await Payroll.findByPk(id);
      if (!payroll) {
        throw ApiError.notFound("Payroll record not found");
      }

      await payroll.update({ status: "processed" });

      const updatedPayroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      res.json({ data: updatedPayroll, message: "Payroll marked as processed" });
    } catch (error) {
      logger.error(`Error processing payroll: ${error}`);
      next(error);
    }
  }

  static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const payroll = await Payroll.findByPk(id);
      if (!payroll) {
        throw ApiError.notFound("Payroll record not found");
      }

      await payroll.update({ status: "paid" });

      const updatedPayroll = await Payroll.findByPk(id, {
        include: [{ model: Employee, as: "employee", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      res.json({ data: updatedPayroll, message: "Payroll marked as paid" });
    } catch (error) {
      logger.error(`Error marking payroll as paid: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const payroll = await Payroll.findByPk(id);
      if (!payroll) {
        throw ApiError.notFound("Payroll record not found");
      }

      await payroll.destroy();

      res.json({ message: "Payroll deleted successfully" });
    } catch (error) {
      logger.error(`Error deleting payroll: ${error}`);
      next(error);
    }
  }
}
