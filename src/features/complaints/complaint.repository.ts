import { CreationAttributes, Includeable, Transaction, WhereOptions } from 'sequelize';
import { Department } from '../department/department.model';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';
import { Complaint, ComplaintStatus } from './complaint.model';

// Complaint queries never log SQL, so complaint content and ownership stay out of application logs.
const NO_LOGGING = { logging: false as const };

const reviewerIncludes: Includeable[] = [
  {
    model: Employee,
    as: 'employee',
    attributes: ['id', 'firstName', 'lastName', 'staffId'],
    include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
  },
  { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
  { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'] },
];

export class ComplaintRepository {
  static readonly reviewerIncludes = reviewerIncludes;

  static readonly create = (values: CreationAttributes<Complaint>, transaction: Transaction) => {
    return Complaint.create(values, { transaction, ...NO_LOGGING });
  };

  static readonly setReference = (id: number, reference: string, transaction: Transaction) => {
    return Complaint.update({ reference }, { where: { id }, transaction, ...NO_LOGGING });
  };

  static readonly findById = (id: number, { withReviewerIncludes = false } = {}) => {
    return Complaint.findByPk(id, {
      include: withReviewerIncludes ? reviewerIncludes : [],
      ...NO_LOGGING,
    });
  };

  static readonly findForEmployee = (employeeId: number, { page, rows }: { page: number; rows: number }) => {
    return Complaint.findAndCountAll({
      where: { employeeId },
      limit: rows,
      offset: (page - 1) * rows,
      order: [['createdAt', 'DESC']],
      ...NO_LOGGING,
    });
  };

  static readonly findForReviewers = ({ page, rows, where }: { page: number; rows: number; where: WhereOptions<Complaint> }) => {
    return Complaint.findAndCountAll({
      where,
      include: reviewerIncludes,
      limit: rows,
      offset: (page - 1) * rows,
      order: [['createdAt', 'DESC']],
      distinct: true,
      ...NO_LOGGING,
    });
  };

  // Joins the employee (without selecting any columns) so staff-name search conditions work in counts too.
  static readonly countForReviewers = (where: WhereOptions<Complaint>) => {
    return Complaint.count({
      where,
      include: [{ model: Employee, as: 'employee', attributes: [] }],
      distinct: true,
      col: 'id',
      ...NO_LOGGING,
    });
  };

  /**
   * Moves a complaint between statuses only if it is still in `fromStatus`.
   * Returns the number of rows changed: 0 means someone else already processed it.
   */
  static readonly transition = async (
    id: number,
    fromStatus: ComplaintStatus,
    values: Partial<
      Pick<Complaint, 'status' | 'reviewedBy' | 'reviewerNote' | 'reviewedDate' | 'approvedBy' | 'approverNote' | 'approvedDate'>
    >,
    transaction: Transaction,
  ) => {
    const [affected] = await Complaint.update(values, { where: { id, status: fromStatus }, transaction, ...NO_LOGGING });
    return affected;
  };
}
