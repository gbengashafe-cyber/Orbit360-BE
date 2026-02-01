import { Op } from 'sequelize';
import { Employee } from '../features/employee/employee.model';
import { Leave } from '../features/leave/leave.model';
import { Loan } from '../features/loans/loan.model';
import { User } from '../features/users/user.model';

export class AuthorizationRepository {
  static readonly getPendingLoans = async (limit: number) => {
    return Loan.findAll({
      where: { status: 'PENDING_APPROVAL' },
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email', 'staffId'] },
        { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName'] },
      ],
      limit,
      raw: true,
      nest: true,
    });
  };

  static readonly getPendingLeaves = async (limit: number) => {
    return Leave.findAll({
      where: { status: 'pending' },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email', 'staffId'] }],
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
  static readonly getCountsByModules = async (modules: string[], userId: number) => {
    const tasks: Promise<{ key: string; count: number }>[] = [];

    if (modules.includes('LOANS')) {
      tasks.push(
        Loan.count({ where: { status: 'PENDING_APPROVAL', createdBy: { [Op.ne]: userId } } }).then((c) => ({
          key: 'loans',
          count: c,
        })),
      );
    }
    if (modules.includes('LEAVES')) {
      tasks.push(
        Leave.count({ where: { status: 'pending', employeeId: { [Op.ne]: userId } } }).then((c) => ({ key: 'leaves', count: c })),
      );
    }
    if (modules.includes('EMPLOYEES')) {
      tasks.push(
        Employee.count({ where: { status: 'pending_approval', createdBy: { [Op.ne]: userId } } }).then((c) => ({
          key: 'employees',
          count: c,
        })),
      );
    }

    return Promise.all(tasks);
  };

  static readonly getPendingByModule = async (module: string, page: number, rows: number) => {
    const offset = (page - 1) * rows;

    switch (module.toUpperCase()) {
      case 'LOANS':
        return Loan.findAndCountAll({
          where: { status: 'PENDING_APPROVAL' },
          limit: rows,
          offset: offset,
          include: [
            { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email', 'staffId'] },
            { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName'] },
          ],
          order: [['createdAt', 'DESC']],
        });
      case 'LEAVES':
        return Leave.findAndCountAll({
          where: { status: 'pending' },
          limit: rows,
          offset: offset,
          include: ['employee'],
          order: [['createdAt', 'DESC']],
        });
      case 'EMPLOYEES':
        return Employee.findAndCountAll({
          where: { status: 'pending_approval' },
          limit: rows,
          offset: offset,
          order: [['createdAt', 'DESC']],
        });
      default:
        return null;
    }
  };
}
