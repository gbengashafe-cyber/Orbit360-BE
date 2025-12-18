import { NextFunction, Request, Response } from "express";
import { Department } from "../models";
import { ApiError } from "../utils/api-error";
import { logger } from "../utils/logger";

export class DepartmentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, rows } = req.body.pagination!;
      const offset = (page - 1) * rows;

      const { count, rows: departments } = await Department.findAndCountAll({
        limit: rows,
        offset,
        order: [["createdAt", "DESC"]],
      });

      res.json({
        data: departments,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      });
    } catch (error) {
      logger.error(`Error fetching departments: ${error}`);
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const department = await Department.findByPk(id, {
        include: [{ association: "employees", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      if (!department) {
        throw ApiError.notFound("Department not found");
      }

      res.json({ data: department });
    } catch (error) {
      logger.error(`Error fetching department: ${error}`);
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;

      const department = await Department.create({
        name,
        description,
      });

      res.status(201).json({ data: department, message: "Department created successfully" });
    } catch (error) {
      logger.error(`Error creating department: ${error}`);
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const department = await Department.findByPk(id);
      if (!department) {
        throw ApiError.notFound("Department not found");
      }

      await department.update({ name, description });

      res.json({ data: department, message: "Department updated successfully" });
    } catch (error) {
      logger.error(`Error updating department: ${error}`);
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const department = await Department.findByPk(id);
      if (!department) {
        throw ApiError.notFound("Department not found");
      }

      await department.destroy();

      res.json({ message: "Department deleted successfully" });
    } catch (error) {
      logger.error(`Error deleting department: ${error}`);
      next(error);
    }
  }
}
