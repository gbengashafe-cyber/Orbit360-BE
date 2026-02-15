import { col, fn, literal, Op, WhereOptions } from 'sequelize';
import { Employee } from '../features/employee/employee.model';
import { Leave } from '../features/leave/leave.model';
import { Loan } from '../features/loans/loan.model';

type AggregatedMetrics = {
  totalHeadcount: number;
  totalTerminations: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
};

type AggregatedLeave = {
  pendingRequests: number;
  currentlyOnLeave: number;
};

export type DashboardStatsParams = {
  startDate: Date;
  endDate: Date;
  department?: string;
};

export class DashboardRepository {
  static readonly getGeneralMetrics = async (department?: string) => {
    const where: WhereOptions = department ? { departmentName: department } : {};

    return Employee.findOne({
      attributes: [
        [literal(`COUNT(DISTINCT CASE WHEN status IN ('active', 'on_leave', 'suspended') THEN id END)`), 'totalHeadcount'],
        [literal(`COUNT(CASE WHEN status = 'terminated' THEN 1 END)`), 'totalTerminations'],
        [fn('AVG', col('annual_basic_salary')), 'avgSalary'],
        [fn('MIN', col('annual_basic_salary')), 'minSalary'],
        [fn('MAX', col('annual_basic_salary')), 'maxSalary'],
      ],
      where,
      raw: true,
    }) as unknown as Promise<AggregatedMetrics | null>;
  };

  static readonly getLeaveCounts = async ({ startDate, endDate, department }: DashboardStatsParams) => {
    const employeeWhere = department ? { departmentName: department } : {};

    return Leave.findOne({
      attributes: [
        [
          fn(
            'SUM',
            literal(`CASE WHEN Leave.status = 'pending' AND Leave.created_at BETWEEN :startDate AND :endDate
              THEN 1 ELSE 0 END`),
          ),
          'pendingRequests',
        ],
        [
          fn(
            'SUM',
            literal(`
            CASE WHEN Leave.status = 'approved' AND Leave.created_at between :startDate
               AND :endDate THEN 1 ELSE 0 END
          `),
          ),
          'currentlyOnLeave',
        ],
      ],
      replacements: { startDate, endDate },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: [],
          where: employeeWhere,
        },
      ],
      raw: true,
    }) as unknown as Promise<AggregatedLeave | null>;
  };

  static readonly getAttritionTrend = async ({ startDate, endDate, department }: DashboardStatsParams) => {
    const where: any = {
      status: 'terminated',
      terminationDate: {
        [Op.ne]: null,
        [Op.between]: [startDate, endDate],
      },
    };

    if (department) where.departmentName = department;

    return Employee.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('termination_date'), '%Y-%m'), 'month'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where,
      group: [literal("DATE_FORMAT(termination_date, '%Y-%m')") as any as string],
      order: [[literal('month'), 'ASC']],
      raw: true,
    }) as unknown as Promise<{ month: string; count: number }[]>;
  };

  static readonly getGenderDistribution = async (department?: string) => {
    const where: any = { status: { [Op.ne]: 'terminated' } };
    if (department) where.departmentName = department;

    return Employee.findAll({
      attributes: [
        ['gender', 'name'],
        [fn('COUNT', col('id')), 'value'],
      ],
      where,
      group: ['gender'],
      raw: true,
    }) as unknown as Promise<{ name: 'M' | 'F'; value: number }[]>;
  };

  static readonly getPendingLoanRequests = async () => {
    return Loan.count({ where: { status: 'PENDING_REVIEW' } });
  };
}
