import { Request, Response } from 'express';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { Employee } from '../employee/employee.model';
import { LeaveBalance } from './leave-balance.model';
import { LeaveType } from './leave-type.model';
import { Leave } from './leave.model';
import { calculateWorkingDays, validateLeaveDates } from './leave.utils';

export class LeaveController {
  static async create(req: Request, res: Response) {
    const {
      startDate,
      endDate,
      type,
      reason,
      leave_period,
      selected_supervisor_id,
      covering_employee_id,
      handover_notes,
      emergency_contact,
      alternative_email,
    } = req.body;

    // Extract files from multipart upload
    const files = (req as any).files || [];
    const supportingDocs = files
      .filter((f: any) => f.fieldname === 'supporting_documents')
      .map((f: any) => ({
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
        uploaded_at: new Date().toISOString(),
      }));
    const handoverDocs = files
      .filter((f: any) => f.fieldname === 'handover_documents')
      .map((f: any) => ({
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
        uploaded_at: new Date().toISOString(),
      }));
    const user = req.user;

    if (!user) {
      throw ApiError.unauthenticated('User not authenticated');
    }

    // Get employee record for current user
    const employee = await Employee.findOne({
      where: { email: user.email },
    });

    if (!employee) {
      throw ApiError.badRequest('Employee record not found for this user');
    }

    // Validate leave dates
    const dateError = validateLeaveDates(startDate, endDate);
    if (dateError) {
      throw ApiError.badRequest(dateError);
    }

    // Calculate working days (excluding weekends)
    const workingDays = calculateWorkingDays(startDate, endDate);

    const leave = await Leave.create({
      employeeId: employee.id,
      startDate,
      endDate,
      type,
      reason,
      leave_period,
      selected_supervisor_id,
      covering_employee_id,
      handover_notes,
      emergency_contact,
      alternative_email,
      supporting_documents: supportingDocs.length > 0 ? JSON.stringify(supportingDocs) : null,
      handover_documents: handoverDocs.length > 0 ? JSON.stringify(handoverDocs) : null,
      status: 'pending',
    });

    const createdLeave = await Leave.findByPk(leave.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: { exclude: ['staffId', 'approvedBy'] },
        },
      ],
    });

    // Get leave balance for this employee and leave type
    const leaveBalance = await LeaveBalance.findOne({
      where: { employeeId: employee.id, leaveType: type, year: new Date().getFullYear() },
    });

    res.status(201).json(
      ApiResponse({
        data: createdLeave,
        message: 'Leave request created successfully',
        leaveInfo: {
          calculatedDays: workingDays,
          allocatedDays: leaveBalance?.totalDays || 0,
          remainingDays: leaveBalance ? leaveBalance.remainingDays - workingDays : 0,
        },
      }),
    );
  }

  static async calculateLeaveDays(req: Request, res: Response) {
    const { employeeId, startDate, endDate, type } = req.body;

    // Validate leave dates
    const dateError = validateLeaveDates(startDate, endDate);
    if (dateError) {
      throw ApiError.badRequest(dateError);
    }

    // Calculate working days (excluding weekends)
    const workingDays = calculateWorkingDays(startDate, endDate);

    // Get leave balance for this employee and leave type
    const leaveBalance = await LeaveBalance.findOne({
      where: { employeeId, leaveType: type, year: new Date().getFullYear() },
    });

    res.json(
      ApiResponse({
        message: 'Leave days calculated successfully',
        data: {
          calculatedDays: workingDays,
          allocatedDays: leaveBalance?.totalDays || 0,
          usedDays: leaveBalance?.usedDays || 0,
          remainingDays: leaveBalance ? leaveBalance.remainingDays - workingDays : 0,
          startDate,
          endDate,
          leaveType: type,
        },
      }),
    );
  }

  static async getAll(req: Request, res: Response) {
    const { page, rows } = req.pagination;
    const offset = (page - 1) * rows;

    const { count, rows: leaves } = await Leave.findAndCountAll({
      attributes: [
        'id',
        'employeeId',
        'startDate',
        'endDate',
        'type',
        'status',
        'reason',
        'leave_period',
        'selected_supervisor_id',
        'covering_employee_id',
        'handover_notes',
        'emergency_contact',
        'alternative_email',
        'rejection_reason',
        'supporting_documents',
        'handover_documents',
        'createdAt',
        'updatedAt',
      ],
      limit: rows,
      offset,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: { exclude: ['staffId', 'approvedBy'] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(
      ApiResponse({
        data: leaves,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      }),
    );
  }

  static async getByEmployee(req: Request, res: Response) {
    const { employeeId } = req.params;
    const { page, rows } = req.pagination;
    const offset = (page - 1) * rows;

    const { count, rows: leaves } = await Leave.findAndCountAll({
      where: { employeeId },
      attributes: [
        'id',
        'employeeId',
        'startDate',
        'endDate',
        'type',
        'status',
        'reason',
        'leave_period',
        'selected_supervisor_id',
        'covering_employee_id',
        'handover_notes',
        'emergency_contact',
        'alternative_email',
        'rejection_reason',
        'createdAt',
        'updatedAt',
      ],
      limit: rows,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json(
      ApiResponse({
        data: leaves,
        pagination: {
          total: count,
          page,
          rows,
          pages: Math.ceil(count / rows),
        },
      }),
    );
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const leave = await Leave.findByPk(id, {
      attributes: [
        'id',
        'employeeId',
        'startDate',
        'endDate',
        'type',
        'status',
        'reason',
        'leave_period',
        'selected_supervisor_id',
        'covering_employee_id',
        'handover_notes',
        'emergency_contact',
        'alternative_email',
        'rejection_reason',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: { exclude: ['staffId', 'approvedBy'] },
        },
      ],
    });

    if (!leave) {
      throw ApiError.notFound('Leave request not found');
    }

    res.json(ApiResponse({ data: leave }));
  }

  static async getLeaveBalance(req: Request, res: Response) {
    const { employeeId } = req.params;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const balances = await LeaveBalance.findAll({
      where: { employeeId, year },
      order: [['leaveType', 'ASC']],
    });

    res.json(ApiResponse({ data: balances }));
  }

  static async getLeaveTypes(req: Request, res: Response) {
    const leaveTypes = await LeaveType.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });

    res.json(ApiResponse({ data: leaveTypes }));
  }

  static async approveOrDecline(req: Request, res: Response) {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(action.toLowerCase())) {
      throw ApiError.badRequest('Invalid action. Must be "approved" or "rejected"');
    }

    const leave = await Leave.findByPk(id);
    if (!leave) {
      throw ApiError.notFound('Leave request not found');
    }

    if (leave.status !== 'pending') {
      throw ApiError.badRequest('Leave request has already been processed');
    }

    const employeeRecord = await Employee.findByPk(leave.employeeId);

    if (employeeRecord?.supervisorId !== req.user?.employeeRecord?.id) {
      throw ApiError.forbidden(
        'You are no authorised to approve leave for this employee. Kindly contact the employee to approve.',
      );
    }
    const updateData: any = { status: action };
    if (action.toLowerCase() === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    await db.transaction(async (transaction) => {
      await leave.update(updateData, { transaction });
      if (action.toLowerCase() === 'approved') {
        await Employee.update({ status: 'ON_LEAVE' }, { where: { id: leave.employeeId }, transaction });
      }
    });

    const updatedLeave = await Leave.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: { exclude: ['staffId', 'approvedBy'] },
        },
      ],
    });

    res.json(ApiResponse({ data: updatedLeave, message: `Leave request ${action}` }));
  }

  static async cancel(req: Request, res: Response) {
    const { id } = req.params;

    const leave = await Leave.findByPk(id);
    if (!leave) {
      throw ApiError.notFound('Leave request not found');
    }

    if (leave.status === 'approved') {
      throw ApiError.badRequest('Cannot cancel an approved leave request');
    }

    await leave.destroy();

    res.json(ApiResponse({ data: {}, message: 'Leave request cancelled successfully' }));
  }
}
