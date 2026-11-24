import { col, fn, Op, where as sqlWhere, WhereOptions } from 'sequelize';
import { AuditLog } from '../../audit-log/audit-log.model';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { Employee } from '../employee/employee.model';
import { Complaint, ComplaintStatus } from './complaint.model';
import { ComplaintRepository } from './complaint.repository';
import { toOwnerView, toReviewerView } from './complaint.serializer';

type SessionUser = { id: number; email: string; permissions?: string[] };
type Pagination = { page: number; rows: number };
export type ReviewerFilters = {
  status?: ComplaintStatus;
  severity?: string;
  search?: string;
  dateFrom?: string; // YYYY-MM-DD, inclusive (submission date)
  dateTo?: string; // YYYY-MM-DD, inclusive (submission date)
};

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (match) => `\\${match}`);

const buildReviewerWhere = ({ status, severity, search, dateFrom, dateTo }: ReviewerFilters) => {
  const conditions: WhereOptions<Complaint>[] = [];

  if (status) conditions.push({ status });
  if (severity) conditions.push({ severity: severity as Complaint['severity'] });

  if (dateFrom || dateTo) {
    conditions.push({
      reportedDate: {
        ...(dateFrom ? { [Op.gte]: new Date(`${dateFrom}T00:00:00`) } : {}),
        ...(dateTo ? { [Op.lte]: new Date(`${dateTo}T23:59:59.999`) } : {}),
      },
    });
  }

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push({
      [Op.or]: [
        { reference: { [Op.like]: term } },
        { title: { [Op.like]: term } },
        // Staff name / staff ID only match NON-anonymous complaints, so a search can't reveal who filed an anonymous one.
        {
          [Op.and]: [
            { isAnonymous: false },
            {
              [Op.or]: [
                sqlWhere(fn('CONCAT', col('employee.first_name'), ' ', col('employee.last_name')), { [Op.like]: term }),
                sqlWhere(col('employee.staff_id'), { [Op.like]: term }),
              ],
            },
          ],
        },
      ],
    } as WhereOptions<Complaint>);
  }

  // An empty AND matches every row.
  return { [Op.and]: conditions };
};

const REVIEW_PERMISSIONS = ['MANAGE_COMPLAINTS', 'APPROVE_COMPLAINTS'];

// Same message whether the complaint is missing or belongs to someone else, so IDs can't be probed.
const notFound = () => ApiError.notFound('Complaint not found');
const alreadyProcessed = () => ApiError.conflict('This complaint has already been processed.');
// Generic on purpose. (Reviewers learn a complaint is theirs only via `isOwnComplaint`, which only they receive.)
const cannotActOnComplaint = () => ApiError.forbidden('You cannot act on this complaint.');

const buildReference = (id: number, date: Date) => `CMP-${date.getFullYear()}-${String(id).padStart(6, '0')}`;

const pagination = (count: number, { page, rows }: Pagination) => ({
  total: count,
  page,
  rows,
  pages: Math.ceil(count / rows),
});

// Ownership is resolved from the authenticated user's email, never from request data.
const findOwnEmployeeId = async (user: SessionUser) => {
  const employee = await Employee.findOne({ where: { email: user.email }, attributes: ['id'], logging: false });
  return employee?.id ?? null;
};

const canReview = (user: SessionUser) =>
  (user.permissions ?? []).some((permission) => REVIEW_PERMISSIONS.includes(permission.toUpperCase()));

export class ComplaintService {
  static readonly submit = async (user: SessionUser, input: Record<string, any>) => {
    const employeeId = await findOwnEmployeeId(user);

    if (!employeeId) {
      throw ApiError.badRequest('Employee record not found for this user');
    }

    const complaint = await db.transaction(async (transaction) => {
      const created = await ComplaintRepository.create(
        {
          employeeId,
          complaintType: input.complaintType,
          severity: input.severity,
          title: input.title,
          description: input.description,
          incidentDate: input.incidentDate || null,
          witnesses: input.witnesses || null,
          isAnonymous: input.isAnonymous === true,
          status: 'PENDING_REVIEW',
          reportedDate: new Date(),
        },
        transaction,
      );

      const reference = buildReference(created.id, created.reportedDate);
      await ComplaintRepository.setReference(created.id, reference, transaction);
      created.reference = reference;

      await AuditLog.create(
        {
          entity: 'Complaint',
          entityId: String(created.id),
          // Anonymous submissions are not linked to a user in the audit trail.
          userId: created.isAnonymous ? null : user.id,
          action: 'CREATE',
          description: `COMPLAINT SUBMITTED: ${reference}`,
        },
        { transaction },
      );

      return created;
    });

    return toOwnerView(complaint);
  };

  static readonly listOwn = async (user: SessionUser, page: Pagination) => {
    const employeeId = await findOwnEmployeeId(user);

    if (!employeeId) {
      return { data: [], pagination: pagination(0, page) };
    }

    const { count, rows } = await ComplaintRepository.findForEmployee(employeeId, page);
    return { data: rows.map(toOwnerView), pagination: pagination(count, page) };
  };

  static readonly listForReviewers = async (user: SessionUser, filters: ReviewerFilters, page: Pagination) => {
    const viewerEmployeeId = await findOwnEmployeeId(user);
    const { count, rows } = await ComplaintRepository.findForReviewers({ ...page, where: buildReviewerWhere(filters) });
    return {
      data: rows.map((complaint) => toReviewerView(complaint, { viewerEmployeeId })),
      pagination: pagination(count, page),
    };
  };

  // Per-tab totals for the HR page, using the same search/urgency/date filters (status comes from the tab).
  static readonly countsForReviewers = async (filters: Omit<ReviewerFilters, 'status'>) => {
    const [pendingReview, pendingApproval, all] = await Promise.all([
      ComplaintRepository.countForReviewers(buildReviewerWhere({ ...filters, status: 'PENDING_REVIEW' })),
      ComplaintRepository.countForReviewers(buildReviewerWhere({ ...filters, status: 'PENDING_APPROVAL' })),
      ComplaintRepository.countForReviewers(buildReviewerWhere(filters)),
    ]);
    return { PENDING_REVIEW: pendingReview, PENDING_APPROVAL: pendingApproval, all };
  };

  static readonly getById = async (user: SessionUser, id: number) => {
    const complaint = await ComplaintRepository.findById(id, { withReviewerIncludes: canReview(user) });

    if (!complaint) {
      throw notFound();
    }

    const employeeId = await findOwnEmployeeId(user);

    if (employeeId && complaint.employeeId === employeeId) {
      return toOwnerView(complaint);
    }

    if (canReview(user)) {
      return toReviewerView(complaint, { viewerEmployeeId: employeeId });
    }

    throw notFound();
  };

  // Stage 1: HR Officer (MANAGE_COMPLAINTS).
  static readonly review = async (
    user: SessionUser,
    id: number,
    { decision, note }: { decision: 'APPROVE' | 'REJECT'; note?: string },
  ) => {
    const complaint = await ComplaintRepository.findById(id);

    if (!complaint) {
      throw notFound();
    }

    const ownEmployeeId = await findOwnEmployeeId(user);

    if (ownEmployeeId && complaint.employeeId === ownEmployeeId) {
      throw cannotActOnComplaint();
    }

    if (complaint.status !== 'PENDING_REVIEW') {
      throw alreadyProcessed();
    }

    const nextStatus: ComplaintStatus = decision === 'APPROVE' ? 'PENDING_APPROVAL' : 'REJECTED_BY_REVIEWER';

    await db.transaction(async (transaction) => {
      const affected = await ComplaintRepository.transition(
        id,
        'PENDING_REVIEW',
        { status: nextStatus, reviewedBy: user.id, reviewerNote: note || null, reviewedDate: new Date() },
        transaction,
      );

      if (affected === 0) {
        throw alreadyProcessed();
      }

      await AuditLog.create(
        {
          entity: 'Complaint',
          entityId: String(id),
          userId: user.id,
          action: 'UPDATE',
          description: `COMPLAINT REVIEWED: ${complaint.reference}. Decision: ${decision}`,
        },
        { transaction },
      );
    });

    return ComplaintService.getById(user, id);
  };

  // Stage 2: HR Manager (APPROVE_COMPLAINTS).
  static readonly decide = async (
    user: SessionUser,
    id: number,
    { decision, note }: { decision: 'APPROVE' | 'REJECT'; note?: string },
  ) => {
    const complaint = await ComplaintRepository.findById(id);

    if (!complaint) {
      throw notFound();
    }

    const ownEmployeeId = await findOwnEmployeeId(user);

    if (ownEmployeeId && complaint.employeeId === ownEmployeeId) {
      throw cannotActOnComplaint();
    }

    if (complaint.status !== 'PENDING_APPROVAL') {
      throw alreadyProcessed();
    }

    if (complaint.reviewedBy === user.id) {
      throw ApiError.forbidden('Maker-Checker violation: you reviewed this complaint at the first stage.');
    }

    const nextStatus: ComplaintStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED_BY_APPROVER';

    await db.transaction(async (transaction) => {
      const affected = await ComplaintRepository.transition(
        id,
        'PENDING_APPROVAL',
        { status: nextStatus, approvedBy: user.id, approverNote: note || null, approvedDate: new Date() },
        transaction,
      );

      if (affected === 0) {
        throw alreadyProcessed();
      }

      await AuditLog.create(
        {
          entity: 'Complaint',
          entityId: String(id),
          userId: user.id,
          action: 'UPDATE',
          description: `COMPLAINT ${decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'}: ${complaint.reference}`,
        },
        { transaction },
      );
    });

    return ComplaintService.getById(user, id);
  };

  // Authorization Center: complaints awaiting the HR Manager, excluding the user's own and ones they reviewed.
  static readonly pendingApprovalWhere = (userId: number, userEmployeeId?: number): WhereOptions<Complaint> => ({
    status: 'PENDING_APPROVAL',
    reviewedBy: { [Op.ne]: userId },
    ...(userEmployeeId ? { employeeId: { [Op.ne]: userEmployeeId } } : {}),
  });
}
