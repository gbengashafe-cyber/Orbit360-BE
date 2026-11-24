import { Complaint } from './complaint.model';

/**
 * All complaint data leaving the API goes through these functions.
 * Reviewers never receive employeeId, and never receive the employee for anonymous complaints.
 */

const baseFields = (complaint: Complaint) => ({
  id: complaint.id,
  reference: complaint.reference,
  complaintType: complaint.complaintType,
  title: complaint.title,
  description: complaint.description,
  severity: complaint.severity,
  status: complaint.status,
  isAnonymous: complaint.isAnonymous,
  incidentDate: complaint.incidentDate,
  witnesses: complaint.witnesses,
  submittedAt: complaint.reportedDate ?? complaint.createdAt,
  createdAt: complaint.createdAt,
  reviewedDate: complaint.reviewedDate,
  approvedDate: complaint.approvedDate,
});

const personName = (person?: { id?: number; firstName?: string; lastName?: string } | null) =>
  person ? { id: person.id, firstName: person.firstName, lastName: person.lastName } : null;

// For the employee who submitted the complaint. Reviewer identities are not shown, only outcomes.
export const toOwnerView = (complaint: Complaint) => ({
  ...baseFields(complaint),
  reviewerNote: complaint.status === 'REJECTED_BY_REVIEWER' ? complaint.reviewerNote : null,
  approverNote: complaint.status === 'REJECTED_BY_APPROVER' ? complaint.approverNote : null,
});

// For HR Officers / HR Managers.
// `viewerEmployeeId` lets the response say whether the VIEWER filed this complaint (so the UI can explain why they
// can't review it). It never says who else filed it.
export const toReviewerView = (complaint: Complaint, { viewerEmployeeId }: { viewerEmployeeId?: number | null } = {}) => {
  const employee = complaint.employee as any;

  return {
    ...baseFields(complaint),
    isOwnComplaint: !!viewerEmployeeId && complaint.employeeId === viewerEmployeeId,
    submittedBy:
      complaint.isAnonymous || !employee
        ? null
        : {
            firstName: employee.firstName,
            lastName: employee.lastName,
            staffId: employee.staffId,
            department: employee.department?.name ?? null,
          },
    reviewer: personName(complaint.reviewer as any),
    reviewerNote: complaint.reviewerNote,
    approver: personName(complaint.approver as any),
    approverNote: complaint.approverNote,
  };
};
