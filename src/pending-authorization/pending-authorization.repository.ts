import { Op, WhereOptions } from 'sequelize';
import { Department } from '../features/department/department.model';
import { EmployeeChangeRequest } from '../features/employee/employee-change-request.model';
import { EmployeeDraft } from '../features/employee/employee-draft.model';
import { Employee } from '../features/employee/employee.model';
import { Exit } from '../features/exit/exit.model';
import { JobRole } from '../features/job-role/job-role.model';
import { Leave } from '../features/leave/leave.model';
import { LoanType } from '../features/loans/loan-types/loan-types.model';
import { Loan } from '../features/loans/loan.model';
import { PayrollBatch } from '../features/payroll/payroll-batch.model';
import { JobApplication } from '../features/recruitment/job-application.model';
import { JobPosting } from '../features/recruitment/job-posting.model';
import { TrainingRequest } from '../features/training/training-request.model';
import { User } from '../features/users/user.model';
import { PendingModuleItemsProps } from './pending-authorization.service';
import { Company } from '../features/company/company.model';

export class AuthorizationRepository {
  static readonly getPendingLoans = async (limit: number) => {
    return Loan.findAll({
      where: { status: 'PENDING_APPROVAL' },
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
      ],
      limit,
      raw: true,
      nest: true,
    });
  };

  static readonly getPendingLeaves = async (limit: number) => {
    return Leave.findAll({
      where: { status: 'pending' },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit,
      raw: true,
      nest: true,
    });
  };

  static readonly getPendingEmployees = async (limit: number) => {
    return Employee.findAll({
      where: { status: 'pending_approval' },
      limit,
      raw: true,
    });
  };

  static readonly getPendingCounts = async () => {
    return Promise.all([
      Loan.count({ where: { status: 'PENDING_APPROVAL' } }),
      Leave.count({ where: { status: 'pending' } }),
      Employee.count({ where: { status: 'pending_approval' } }),
    ]);
  };

  static readonly getApprovedByChecker = async (checkerId: number, limit: number) => {
    const [loans] = await Promise.all([
      Loan.findAll({
        where: { approvedBy: checkerId },
        include: ['employee'],
        limit,
        order: [['approvedDate', 'DESC']],
        raw: true,
        nest: true,
      }),
    ]);

    return { loans };
  };
  static readonly getCountsByModules = async (modules: string[], userId: number, userEmployeeId: number) => {
    const tasks: Promise<{ key: string; count: number }>[] = [];

    if (modules.includes('LOANS')) {
      tasks.push(
        Loan.count({ where: { status: 'PENDING_APPROVAL' } }).then((c) => ({
          key: 'loans',
          count: c,
        })),
      );
    }
    if (modules.includes('PAYROLLS')) {
      tasks.push(
        PayrollBatch.count({ where: { status: 'PENDING_APPROVAL', createdBy: { [Op.ne]: userId } } }).then((c) => ({
          key: 'payrolls',
          count: c,
        })),
      );
    }
    if (modules.includes('LEAVES')) {
      tasks.push(
        Leave.count({ where: { status: 'pending', employeeId: { [Op.ne]: userEmployeeId } } }).then((c) => ({
          key: 'leaves',
          count: c,
        })),
      );
    }
    if (modules.includes('EXITS')) {
      tasks.push(
        Exit.count({ where: { finalApprovalStatus: 'cleared', employeeId: { [Op.ne]: userEmployeeId } } }).then((c) => ({
          key: 'exits',
          count: c,
        })),
      );
    }
    if (modules.includes('RECRUITMENTS')) {
      tasks.push(
        JobApplication.count({ where: { status: 'INTERVIEW_SCHEDULED' } }).then((c) => ({
          key: 'recruitments',
          count: c,
        })),
      );
    }
    if (modules.includes('EMPLOYEES')) {
      const where: WhereOptions = { status: 'PENDING_APPROVAL', requestedBy: { [Op.ne]: userId } };

      if (userEmployeeId) {
        where.employeeId = { [Op.ne]: userEmployeeId };
      }

      tasks.push(
        EmployeeChangeRequest.count({
          where,
        }).then((c) => ({
          key: 'employees',
          count: c,
        })),
      );
    }
    if (modules.includes('JOB_POSTINGS')) {
      tasks.push(
        JobPosting.count({ where: { status: 'pending_approval' } }).then((c) => ({
          key: 'job postings',
          count: c,
        })),
      );
    }
    if (modules.includes('TRAINING REQUESTS')) {
      tasks.push(
        TrainingRequest.count({
          where: {
            status: ['PENDING_HR_APPROVAL', 'PENDING_SUPERVISOR_APPROVAL'],
          },
        }).then((c) => ({
          key: 'training requests',
          count: c,
        })),
      );
    }

    return Promise.all(tasks);
  };

  static readonly getPendingByModule = async ({
    moduleName,
    page,
    rows,
    supervisorId,
    userEmployeeId,
    userId,
  }: PendingModuleItemsProps) => {
    const offset = (page - 1) * rows;

    switch (moduleName.toUpperCase()) {
      case 'LOANS':
        return Loan.findAndCountAll({
          where: { status: 'PENDING_APPROVAL' },
          limit: rows,
          offset: offset,
          include: [
            { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email', 'staffId'] },
            { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
            { model: LoanType },
          ],
          order: [['createdAt', 'DESC']],
        });
      case 'PAYROLLS':
        return PayrollBatch.findAndCountAll({
          where: { status: 'PENDING_APPROVAL' },
          limit: rows,
          offset: offset,
          include: [{ model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName'] }],
          order: [['createdAt', 'DESC']],
        });
      case 'JOB POSTINGS':
        return JobPosting.findAndCountAll({
          where: { status: 'PENDING_APPROVAL' },
          limit: rows,
          offset: offset,
          include: [{ model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName'] }],
          order: [['createdAt', 'DESC']],
        });
      case 'TRAINING REQUESTS':
        return TrainingRequest.findAndCountAll({
          where: {
            status: ['PENDING_HR_APPROVAL', 'PENDING_SUPERVISOR_APPROVAL'],
          },
          limit: rows,
          offset: offset,
          include: [
            { model: Employee, attributes: ['id', 'firstName', 'lastName', 'staffId'] },
            { model: User, as: 'supervisorApprover', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'hrReviewer', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'hrApprover', attributes: ['id', 'firstName', 'lastName'] },
          ],
          order: [['createdAt', 'DESC']],
        });
      case 'EXITS':
        return Exit.findAndCountAll({
          where: { finalApprovalStatus: 'cleared' },
          limit: rows,
          offset: offset,
          include: [
            {
              model: Employee,
              as: 'employee',
              attributes: ['id', 'firstName', 'lastName', 'staffId', 'hireDate'],
              include: [
                { model: Department, as: 'department', attributes: ['id', 'name', 'description'] },
                { model: JobRole, as: 'jobRole', attributes: ['id', 'title', 'description'] },
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
        });
      case 'LEAVES':
        return Leave.findAndCountAll({
          where: { status: 'pending', employeeId: { [Op.ne]: userEmployeeId } },
          limit: rows,
          offset: offset,
          include: [
            {
              model: Employee,
              as: 'employee',
              where: supervisorId ? { supervisorId } : {},
              include: [{ model: Employee, as: 'supervisor' }],
            },
          ],
          order: [['createdAt', 'DESC']],
          distinct: true,
        });
      case 'EMPLOYEES': {
        const where: WhereOptions = { status: 'PENDING_APPROVAL', requestedBy: { [Op.ne]: userId } };

        if (userEmployeeId) {
          where.employeeId = { [Op.ne]: userEmployeeId };
        }
        return EmployeeChangeRequest.findAndCountAll({
          where,
          limit: rows,
          offset,
          distinct: true,
          include: [
            {
              model: User,
              as: 'initiator',
              attributes: ['id', 'firstName', 'lastName'],
            },
            {
              model: EmployeeDraft,
              as: 'employeeDraft',
              include: [
                { model: Employee, as: 'draftSupervisor', attributes: ['id', 'firstName', 'lastName'] },
                { model: Department, attributes: ['id', 'name'] },
                { model: Company, attributes: ['id', 'name'] },
                { model: JobRole, attributes: ['id', 'title'] },
              ],
            },
            {
              model: Employee,
              attributes: ['id', 'staffId', 'firstName', 'lastName'],
            },
          ],
          order: [['createdAt', 'DESC']],
        });
      }

      default:
        return null;
    }
  };
}
