import { Employee } from '../features/employee/employee.model';
import { Leave } from '../features/leave/leave.model';
import { LeaveBalance } from '../features/leave/leave-balance.model';
import { Loan } from '../features/loans/loan.model';
import { TrainingRequest } from '../features/training/training-request.model';
import { Exit } from '../features/exit/exit.model';
import { Complaint } from '../features/complaints/complaint.model';
import { Payroll } from '../features/payroll/payroll.model';
import { JobRole } from '../features/job-role/job-role.model';
import { Department } from '../features/department/department.model';
import { Company } from '../features/company/company.model';

const pending = {
  leave: ['pending'],
  loan: ['PENDING_REVIEW', 'PENDING_APPROVAL'],
  training: ['PENDING_SUPERVISOR_APPROVAL', 'PENDING_HR_REVIEW', 'PENDING_HR_APPROVAL'],
  exit: ['submitted', 'under_review', 'clearance_pending'],
  complaint: ['PENDING_REVIEW', 'PENDING_APPROVAL'],
};

export async function getPersonalDashboard(email: string) {
  const employee = await Employee.findOne({
    where: { email },
    attributes: ['id', 'firstName', 'lastName', 'staffId', 'status'],
    include: [
      { model: JobRole, as: 'jobRole', attributes: ['title'] },
      { model: Department, as: 'department', attributes: ['name'] },
      { model: Company, as: 'company', attributes: ['name'] },
    ],
    logging: false,
  });
  if (!employee) return { employee: null };
  const employeeId = employee.id;
  const year = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', year: 'numeric' }).format(new Date()));
  const sources = [
    { key: 'leave', model: Leave, attributes: ['id', 'status', 'createdAt'], title: 'Leave request', path: '/leave-management' },
    { key: 'loan', model: Loan, attributes: ['id', 'status', 'createdAt'], title: 'Loan request', path: '/employee-cooperative' },
    {
      key: 'training',
      model: TrainingRequest,
      attributes: ['id', 'status', 'createdAt'],
      title: 'Training request',
      path: '/request-training',
    },
    { key: 'exit', model: Exit, attributes: ['id', 'status', 'createdAt'], title: 'Exit request', path: '/exit-management' },
    {
      key: 'complaint',
      model: Complaint,
      attributes: ['id', 'status', 'createdAt'],
      title: 'Staff complaint',
      path: '/staff-complaints',
    },
  ] as const;
  const [balance, active, payroll, ...results] = await Promise.allSettled([
    LeaveBalance.findOne({ where: { employeeId, year, leaveType: 'annual' }, attributes: ['remainingDays'], logging: false }),
    Loan.count({ where: { employeeId, status: 'ACTIVE' }, logging: false }),
    Payroll.findOne({
      where: { employeeId, status: 'APPROVED' },
      attributes: ['payPeriod'],
      order: [['payPeriod', 'DESC']],
      logging: false,
    }),
    ...sources.map(async ({ key, model, attributes, title, path }) => {
      const where = { employeeId };
      const [count, rows] = await Promise.all([
        (model as typeof Leave).count({
          where: {
            ...where,
            status: pending[key],
            ...(key === 'exit' ? { finalApprovalStatus: ['pending', 'issues', 'cleared'] } : {}),
          },
          logging: false,
        }),
        (model as typeof Leave).findAll({
          where,
          attributes: [...attributes, ...(key === 'exit' ? ['finalApprovalStatus'] : [])],
          order: [['createdAt', 'DESC']],
          limit: 5,
          logging: false,
        }),
      ]);
      return {
        count,
        rows: rows.map((row) => ({
          id: String(row.id),
          status: key === 'exit' && (row as unknown as Exit).finalApprovalStatus === 'rejected' ? 'rejected' : row.status,
          createdAt: row.createdAt,
          type: key,
          title,
          path,
        })),
      };
    }),
  ]);
  const complete = results.every((result) => result.status === 'fulfilled');
  const requests = results.flatMap((result) => (result.status === 'fulfilled' ? result.value.rows : []));
  requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return {
    employee: employee.get({ plain: true }),
    leaveBalance: balance.status === 'fulfilled' ? (balance.value?.remainingDays ?? null) : null,
    activeLoans: active.status === 'fulfilled' ? active.value : null,
    latestPayslip: payroll.status === 'fulfilled' ? (payroll.value?.payPeriod ?? null) : null,
    pendingRequests: complete
      ? results.reduce((sum, result) => sum + (result.status === 'fulfilled' ? result.value.count : 0), 0)
      : null,
    recentRequests: requests.slice(0, 5),
    requestsIncomplete: !complete,
  };
}
