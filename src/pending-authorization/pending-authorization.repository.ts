import { Employee } from '../features/employee/employee.model';
import { Leave } from '../features/leave/leave.model';
import { Loan } from '../features/loans/loan.model';
import { User } from '../features/users/user.model';

export class ApprovalRepository {
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
}
