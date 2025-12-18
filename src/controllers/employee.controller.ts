import { NextFunction, Request, Response } from "express";
import { Department, Employee, Position } from "../models";
import { ApiError } from "../utils/api-error";
import { logger } from "../utils/logger";

export class EmployeeController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.body.pagination!;
      const offset = (page - 1) * rows;

      const { count, rows: employees } = await Employee.findAndCountAll({
        limit: rows,
        offset,
        include: [
          { model: Department, as: "department", attributes: ["id", "name"] },
          { model: Position, as: "position", attributes: ["id", "title"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json({
        data: employees,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching employees: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employee = await Employee.findByPk(id, {
        include: [
          { model: Department, as: "department", attributes: ["id", "name"] },
          { model: Position, as: "position", attributes: ["id", "title"] },
        ],
      });

      if (!employee) {
        throw ApiError.notFound("Employee not found");
      }

      res.json({ data: employee });
    } catch (error) {
      logger.error(`Error fetching employee: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, phone, hireDate, salary, departmentId, positionId, status } = req.body;

      const employee = await Employee.create({
        firstName,
        lastName,
        email,
        phone,
        hireDate,
        salary,
        departmentId,
        positionId,
        status: status || "active",
      });

      const createdEmployee = await Employee.findByPk(employee.id, {
        include: [
          { model: Department, as: "department", attributes: ["id", "name"] },
          { model: Position, as: "position", attributes: ["id", "title"] },
        ],
      });

      res.status(201).json({ data: createdEmployee, message: "Employee created successfully" });
    } catch (error) {
      logger.error(`Error creating employee: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, hireDate, salary, departmentId, positionId, status } = req.body;

      const employee = await Employee.findByPk(id);
      if (!employee) {
        throw ApiError.notFound("Employee not found");
      }

      await employee.update({
        firstName,
        lastName,
        phone,
        hireDate,
        salary,
        departmentId,
        positionId,
        status,
      });

      const updatedEmployee = await Employee.findByPk(id, {
        include: [
          { model: Department, as: "department", attributes: ["id", "name"] },
          { model: Position, as: "position", attributes: ["id", "title"] },
        ],
      });

      res.json({ data: updatedEmployee, message: "Employee updated successfully" });
    } catch (error) {
      logger.error(`Error updating employee: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const employee = await Employee.findByPk(id);
      if (!employee) {
        throw ApiError.notFound("Employee not found");
      }

      await employee.destroy();

      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      logger.error(`Error deleting employee: ${error}`);
      next(error);
    }
  }
}
