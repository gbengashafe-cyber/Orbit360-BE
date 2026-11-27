import { z } from 'zod';
import { formatNotificationDate } from './notification.dates';
import {
  NOTIFICATION_ENTITY_TYPES,
  NotificationAudience,
  NotificationCategory,
  NotificationEntityType,
} from './notification.model';
import type { Permission } from '../permissions';
import { RecipientRef } from './notification.recipients';

/**
 * Central registry of notification events.
 *
 * Each definition owns everything about one event: its category, audience, the payload it expects,
 * who receives it, its title and message copy, the record it points to, its metadata and its idempotency key.
 * Workflows dispatch after successful writes, using notifyAfterCommit for transactions.
 *
 * Workflow review tasks address an assigned supervisor or an eligible action queue.
 *
 * Copy rules: approved UX copy is used verbatim; dates are payload timestamps formatted DD/MM/YYYY in Africa/Lagos.
 */

export type NotificationMetadataValue = string | number | boolean | null;
export type NotificationMetadata = Record<string, NotificationMetadataValue>;

export interface NotificationEventDefinition<TPayload> {
  category: NotificationCategory;
  audience: NotificationAudience;
  /** The payload this event expects. Unknown keys are rejected so nothing extra can leak into a notification. */
  schema: z.ZodType<TPayload>;
  /** Upper bound on resolved recipients; dispatch fails closed above it (protects against accidental fan-out). */
  maxRecipients: number;
  recipients: (payload: TPayload) => RecipientRef[];
  title: (payload: TPayload) => string;
  message: (payload: TPayload) => string;
  entity: (payload: TPayload) => { type: NotificationEntityType; id: string } | null;
  actorUserId: (payload: TPayload) => number | null;
  metadata: (payload: TPayload) => NotificationMetadata | null;
  /** Stable per-recipient idempotency key. Combined with the recipient in a UNIQUE index. */
  dedupeKey: (payload: TPayload) => string;
}

const defineEvent = <TSchema extends z.ZodType>(
  definition: NotificationEventDefinition<z.output<TSchema>> & { schema: TSchema },
) => definition;

// ─── Payload building blocks ────────────────────────────────────────────────
const id = z.number().int().positive();
const timestamp = z.coerce.date();
const optionalActor = id.nullable().optional();
const reason = z.string().trim().max(1000).nullable().optional();

const iso = (date: Date) => date.toISOString();
const keyFor = (eventType: string, entity: NotificationEntityType, entityId: number | string) =>
  `${eventType}:${entity}:${entityId}`;
const requester = (employeeId: number): RecipientRef[] => [{ kind: 'employee', employeeId }];

// ─── Leave ──────────────────────────────────────────────────────────────────
const leavePayload = z.strictObject({
  leaveId: id,
  requesterEmployeeId: id,
  submittedAt: timestamp,
  actorUserId: optionalActor,
});
const leaveRejectedPayload = leavePayload.extend({ reason });

const leaveEvent = (
  eventType: string,
  title: string,
  message: (submittedOn: string) => string,
  status: string,
  schema: typeof leavePayload | typeof leaveRejectedPayload = leavePayload,
) =>
  defineEvent({
    category: 'LEAVE',
    audience: 'REQUESTER',
    schema,
    maxRecipients: 1,
    recipients: (p) => requester(p.requesterEmployeeId),
    title: () => title,
    message: (p) => message(formatNotificationDate(p.submittedAt)),
    entity: (p) => ({ type: 'leave', id: String(p.leaveId) }),
    actorUserId: (p) => p.actorUserId ?? null,
    metadata: (p) => ({ status, submittedAt: iso(p.submittedAt), ...('reason' in p && p.reason ? { reason: p.reason } : {}) }),
    dedupeKey: (p) => keyFor(eventType, 'leave', p.leaveId),
  });

// ─── Loan ───────────────────────────────────────────────────────────────────
const loanPayload = z.strictObject({
  loanId: id,
  requesterEmployeeId: id,
  submittedAt: timestamp,
  actorUserId: optionalActor,
});
const loanRejectedPayload = loanPayload.extend({ reason });

const loanEvent = (
  eventType: string,
  title: string,
  message: (submittedOn: string) => string,
  status: string,
  schema: typeof loanPayload | typeof loanRejectedPayload = loanPayload,
) =>
  defineEvent({
    category: 'LOAN',
    audience: 'REQUESTER',
    schema,
    maxRecipients: 1,
    recipients: (p) => requester(p.requesterEmployeeId),
    title: () => title,
    message: (p) => message(formatNotificationDate(p.submittedAt)),
    entity: (p) => ({ type: 'loan', id: String(p.loanId) }),
    actorUserId: (p) => p.actorUserId ?? null,
    metadata: (p) => ({ status, submittedAt: iso(p.submittedAt), ...('reason' in p && p.reason ? { reason: p.reason } : {}) }),
    dedupeKey: (p) => keyFor(eventType, 'loan', p.loanId),
  });

// ─── Training ───────────────────────────────────────────────────────────────
const trainingPayload = z.strictObject({
  trainingRequestId: z.uuidv4(),
  requesterEmployeeId: id,
  submittedAt: timestamp,
  actorUserId: optionalActor,
});
const trainingRejectedPayload = trainingPayload.extend({ reason });

const trainingEvent = (
  eventType: string,
  title: string,
  message: (submittedOn: string) => string,
  status: string,
  schema: typeof trainingPayload | typeof trainingRejectedPayload = trainingPayload,
) =>
  defineEvent({
    category: 'TRAINING',
    audience: 'REQUESTER',
    schema,
    maxRecipients: 1,
    recipients: (p) => requester(p.requesterEmployeeId),
    title: () => title,
    message: (p) => message(formatNotificationDate(p.submittedAt)),
    entity: (p) => ({ type: 'training_request', id: String(p.trainingRequestId) }),
    actorUserId: (p) => p.actorUserId ?? null,
    metadata: (p) => ({ status, submittedAt: iso(p.submittedAt), ...('reason' in p && p.reason ? { reason: p.reason } : {}) }),
    dedupeKey: (p) => keyFor(eventType, 'training_request', p.trainingRequestId),
  });

// ─── Exit Management ────────────────────────────────────────────────────────
const exitPayload = z.strictObject({
  exitId: z.uuidv4(),
  requesterEmployeeId: id,
  lastWorkingDate: timestamp,
  actorUserId: optionalActor,
});

const exitEvent = (eventType: string, title: string, message: (lastWorkingDate: string) => string, status: string) =>
  defineEvent({
    category: 'EXIT',
    audience: 'REQUESTER',
    schema: exitPayload,
    maxRecipients: 1,
    recipients: (p) => requester(p.requesterEmployeeId),
    title: () => title,
    message: (p) => message(formatNotificationDate(p.lastWorkingDate)),
    entity: (p) => ({ type: 'exit', id: p.exitId }),
    actorUserId: (p) => p.actorUserId ?? null,
    metadata: (p) => ({ status, lastWorkingDate: iso(p.lastWorkingDate) }),
    dedupeKey: (p) => keyFor(eventType, 'exit', p.exitId),
  });

// ─── Reliever ───────────────────────────────────────────────────────────────
// Sent only when the leave is approved (D2). The name is the employee going on leave.
const relieverPayload = z.strictObject({
  leaveId: id,
  relieverEmployeeId: id,
  onLeaveEmployeeName: z.string().trim().min(1).max(120),
  startDate: timestamp,
  endDate: timestamp.optional(),
  actorUserId: optionalActor,
});

// ─── Complaints ─────────────────────────────────────────────────────────────
// Security-critical. Complaint payloads carry ONLY the record id, the public reference, the submission time and the
// owner's employee id (used solely to address the owner). No names, no actor, no complaint content, no notes.
// The schema is strict, so a caller cannot pass anything else; the service additionally forces actorUserId to null
// and restricts complaint metadata to COMPLAINT_METADATA_KEYS.
export const COMPLAINT_METADATA_KEYS = ['reference', 'status', 'submittedAt'] as const;

const complaintPayload = z.strictObject({
  complaintId: id,
  ownerEmployeeId: id,
  reference: z
    .string()
    .trim()
    .regex(/^CMP-\d{4}-\d{6,}$/, 'Invalid complaint reference'),
  submittedAt: timestamp,
});

const complaintEvent = (
  eventType: string,
  title: string,
  message: (p: z.output<typeof complaintPayload>) => string,
  status: string,
) =>
  defineEvent({
    category: 'COMPLAINT',
    audience: 'REQUESTER',
    schema: complaintPayload,
    maxRecipients: 1,
    recipients: (p) => [{ kind: 'employee', employeeId: p.ownerEmployeeId }],
    title: () => title,
    message,
    entity: (p) => ({ type: 'complaint', id: String(p.complaintId) }),
    actorUserId: () => null,
    metadata: (p) => ({ reference: p.reference, status, submittedAt: iso(p.submittedAt) }),
    dedupeKey: (p) => keyFor(eventType, 'complaint', p.complaintId),
  });

// ─── General ────────────────────────────────────────────────────────────────
// Direct notification to explicitly listed accounts. Internal only: there is no API to create these (no broadcast in Phase 2).
const generalPayload = z.strictObject({
  recipientUserIds: z.array(id).min(1).max(500),
  title: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(2000),
  /** Caller-supplied idempotency key, e.g. `announcement:42`. Required so retries never double-deliver. */
  dedupeKey: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(/^[\w:.-]+$/, 'dedupeKey may only contain letters, numbers, _ : . -'),
  entity: z
    .strictObject({ type: z.enum(NOTIFICATION_ENTITY_TYPES), id: z.union([id, z.string().trim().min(1).max(40)]) })
    .optional(),
  actorUserId: optionalActor,
  metadata: z.record(z.string().max(50), z.union([z.string().max(500), z.number(), z.boolean(), z.null()])).optional(),
});

// ─── Registry ───────────────────────────────────────────────────────────────
const workflowPayload = z.strictObject({
  recordId: z.union([id, z.string().min(1).max(40)]),
  occurrence: z.union([id, z.string().min(1).max(64)]).optional(),
  employeeId: id.optional(),
  userId: id.optional(),
});

function workflowEvent(
  event: string,
  category: NotificationCategory,
  entityType: NotificationEntityType,
  policy: Permission | 'maker' | 'employee' | 'supervisor',
  title: string,
  message: string,
) {
  const direct = policy === 'maker' || policy === 'employee';
  return defineEvent({
    category,
    audience: direct ? 'REQUESTER' : 'ACTOR_QUEUE',
    schema: workflowPayload,
    maxRecipients: direct || policy === 'supervisor' ? 1 : Number.MAX_SAFE_INTEGER,
    recipients: (p) => {
      if (policy === 'maker') return p.userId ? [{ kind: 'workflow', assignedUserId: p.userId }] : [];
      if (policy === 'employee') return p.employeeId ? [{ kind: 'workflow', assignedEmployeeId: p.employeeId }] : [];
      if (policy === 'supervisor') return p.employeeId ? [{ kind: 'workflow', supervisorOf: p.employeeId }] : [];
      return [{ kind: 'workflow', permission: policy, excludeEmployeeId: p.employeeId, excludeUserId: p.userId }];
    },
    title: () => title,
    message: () => message,
    entity: (p) => (category === 'COMPLAINT' ? null : { type: entityType, id: String(p.recordId) }),
    metadata: () => null,
    actorUserId: () => null,
    dedupeKey: (p) => keyFor(event, entityType, p.recordId) + (p.occurrence === undefined ? '' : ':' + p.occurrence),
  });
}

function movementEvent(event: string, task: boolean, message: string) {
  return defineEvent({
    category: 'STAFF_MOVEMENT',
    audience: task ? 'ACTOR_QUEUE' : 'REQUESTER',
    schema: z.strictObject({ recordId: id, occurrence: id, userId: id }),
    maxRecipients: 1,
    recipients: (p) => [{ kind: 'workflow', assignedUserId: p.userId }],
    title: () => 'Staff movement',
    message: () => message,
    entity: (p) => ({ type: 'staff_movement', id: String(p.recordId) }),
    metadata: () => null,
    actorUserId: () => null,
    dedupeKey: (p) => event + ':' + p.recordId + ':' + p.occurrence,
  });
}
export const NOTIFICATION_EVENTS = {
  MOVEMENT_REVIEW_REQUIRED: movementEvent('MOVEMENT_REVIEW_REQUIRED', true, 'A staff movement request awaits your review.'),
  MOVEMENT_CORRECTION_REQUIRED: movementEvent(
    'MOVEMENT_CORRECTION_REQUIRED',
    true,
    'A staff movement request requires your attention.',
  ),
  MOVEMENT_OUTCOME: movementEvent('MOVEMENT_OUTCOME', false, 'A decision has been recorded on your staff movement request.'),
  TRAINING_SUPERVISOR_REVIEW: workflowEvent(
    'TRAINING_SUPERVISOR_REVIEW',
    'TRAINING',
    'training_request',
    'supervisor',
    'Training request to review',
    'A training request is awaiting your review.',
  ),
  TRAINING_HR_REVIEW: workflowEvent(
    'TRAINING_HR_REVIEW',
    'TRAINING',
    'training_request',
    'MANAGE_TRAINING_REQUESTS',
    'Training review required',
    'A training request is awaiting HR review.',
  ),
  TRAINING_FINAL_APPROVAL: workflowEvent(
    'TRAINING_FINAL_APPROVAL',
    'TRAINING',
    'training_request',
    'APPROVE_TRAINING_REQUESTS',
    'Training approval required',
    'A training request is awaiting final approval.',
  ),
  LEAVE_REVIEW: workflowEvent(
    'LEAVE_REVIEW',
    'LEAVE',
    'leave',
    'supervisor',
    'Leave request to review',
    'A leave request is awaiting your approval.',
  ),
  LOAN_REVIEW: workflowEvent(
    'LOAN_REVIEW',
    'LOAN',
    'loan',
    'MANAGE_LOANS',
    'Loan review required',
    'A request is awaiting your review.',
  ),
  LOAN_AUTHORIZATION: workflowEvent(
    'LOAN_AUTHORIZATION',
    'LOAN',
    'loan',
    'APPROVE_LOANS',
    'Loan approval required',
    'A request is awaiting your approval.',
  ),
  COMPLAINT_REVIEW: workflowEvent(
    'COMPLAINT_REVIEW',
    'COMPLAINT',
    'complaint',
    'MANAGE_COMPLAINTS',
    'Complaint review required',
    'A request is awaiting your review.',
  ),
  COMPLAINT_AUTHORIZATION: workflowEvent(
    'COMPLAINT_AUTHORIZATION',
    'COMPLAINT',
    'complaint',
    'APPROVE_COMPLAINTS',
    'Complaint authorization required',
    'A request is awaiting your approval.',
  ),
  EXIT_REVIEW: workflowEvent(
    'EXIT_REVIEW',
    'EXIT',
    'exit',
    'MANAGE_EXITS',
    'Exit review required',
    'A request is awaiting your review.',
  ),
  EXIT_AUTHORIZATION: workflowEvent(
    'EXIT_AUTHORIZATION',
    'EXIT',
    'exit',
    'APPROVE_EXITS',
    'Exit authorization required',
    'A request is awaiting your approval.',
  ),
  EMPLOYEE_MANAGEMENT_AUTHORIZATION: workflowEvent(
    'EMPLOYEE_MANAGEMENT_AUTHORIZATION',
    'EMPLOYEE_MANAGEMENT',
    'employee_request',
    'APPROVE_EMPLOYEES',
    'Employee record approval required',
    'A request is awaiting your approval.',
  ),
  RECRUITMENT_AUTHORIZATION: workflowEvent(
    'RECRUITMENT_AUTHORIZATION',
    'RECRUITMENT',
    'job_posting',
    'APPROVE_JOB_POSTINGS',
    'Job posting approval required',
    'A request is awaiting your approval.',
  ),
  PAYROLL_AUTHORIZATION: workflowEvent(
    'PAYROLL_AUTHORIZATION',
    'PAYROLL',
    'payroll_batch',
    'APPROVE_PAYROLLS',
    'Payroll batch approval required',
    'A request is awaiting your approval.',
  ),
  PAYROLL_OVERRIDE_AUTHORIZATION: workflowEvent(
    'PAYROLL_OVERRIDE_AUTHORIZATION',
    'PAYROLL',
    'payroll_batch',
    'APPROVE_PAYROLL_OVERRIDE',
    'Payroll override approval required',
    'A request is awaiting your approval.',
  ),
  DOCUMENTS_AUTHORIZATION: workflowEvent(
    'DOCUMENTS_AUTHORIZATION',
    'DOCUMENTS',
    'deletion_request',
    'APPROVE_DOCUMENT_DELETION',
    'Deletion request approval required',
    'A request is awaiting your approval.',
  ),
  ONBOARDING_REVIEW: workflowEvent(
    'ONBOARDING_REVIEW',
    'ONBOARDING',
    'onboarding',
    'MANAGE_ONBOARDING',
    'Onboarding document review required',
    'A request is awaiting your review.',
  ),
  EMPLOYEE_MANAGEMENT_APPROVED: workflowEvent(
    'EMPLOYEE_MANAGEMENT_APPROVED',
    'EMPLOYEE_MANAGEMENT',
    'employee_request',
    'maker',
    'Employee record request approved',
    'Your employee record request was approved.',
  ),
  EMPLOYEE_MANAGEMENT_REJECTED: workflowEvent(
    'EMPLOYEE_MANAGEMENT_REJECTED',
    'EMPLOYEE_MANAGEMENT',
    'employee_request',
    'maker',
    'Employee record request rejected',
    'Your employee record request was rejected.',
  ),
  RECRUITMENT_APPROVED: workflowEvent(
    'RECRUITMENT_APPROVED',
    'RECRUITMENT',
    'job_posting',
    'maker',
    'Job posting approved',
    'Your job posting was approved.',
  ),
  RECRUITMENT_REJECTED: workflowEvent(
    'RECRUITMENT_REJECTED',
    'RECRUITMENT',
    'job_posting',
    'maker',
    'Job posting rejected',
    'Your job posting was rejected.',
  ),
  PAYROLL_APPROVED: workflowEvent(
    'PAYROLL_APPROVED',
    'PAYROLL',
    'payroll_batch',
    'maker',
    'Payroll batch approved',
    'Your payroll batch was approved.',
  ),
  PAYROLL_REJECTED: workflowEvent(
    'PAYROLL_REJECTED',
    'PAYROLL',
    'payroll_batch',
    'maker',
    'Payroll batch rejected',
    'Your payroll batch was rejected.',
  ),
  DOCUMENTS_APPROVED: workflowEvent(
    'DOCUMENTS_APPROVED',
    'DOCUMENTS',
    'deletion_request',
    'maker',
    'Deletion request approved',
    'Your deletion request was approved.',
  ),
  DOCUMENTS_REJECTED: workflowEvent(
    'DOCUMENTS_REJECTED',
    'DOCUMENTS',
    'deletion_request',
    'maker',
    'Deletion request rejected',
    'Your deletion request was rejected.',
  ),
  ONBOARDING_APPROVED: workflowEvent(
    'ONBOARDING_APPROVED',
    'ONBOARDING',
    'onboarding',
    'employee',
    'Onboarding document approved',
    'Your onboarding document was approved.',
  ),
  ONBOARDING_REJECTED: workflowEvent(
    'ONBOARDING_REJECTED',
    'ONBOARDING',
    'onboarding',
    'employee',
    'Onboarding document rejected',
    'Your onboarding document was rejected.',
  ),
  PAYROLL_OVERRIDE_APPROVED: workflowEvent(
    'PAYROLL_OVERRIDE_APPROVED',
    'PAYROLL',
    'payroll_batch',
    'maker',
    'Payroll override approved',
    'Your payroll override request was approved.',
  ),
  LEAVE_APPLIED: leaveEvent(
    'LEAVE_APPLIED',
    'Leave request submitted',
    (date) => `You applied for leave on ${date}. Status: Pending approval.`,
    'PENDING',
  ),
  LEAVE_APPROVED: leaveEvent(
    'LEAVE_APPROVED',
    'Leave approved',
    (date) => `Your leave request submitted on ${date} has been approved.`,
    'APPROVED',
  ),
  LEAVE_REJECTED: leaveEvent(
    'LEAVE_REJECTED',
    'Leave rejected',
    (date) => `Your leave request submitted on ${date} was rejected.`,
    'REJECTED',
    leaveRejectedPayload,
  ),
  LEAVE_CANCELLED: leaveEvent(
    'LEAVE_CANCELLED',
    'Leave cancelled',
    (date) => `Your leave request submitted on ${date} was cancelled.`,
    'CANCELLED',
  ),

  LOAN_APPLIED: loanEvent(
    'LOAN_APPLIED',
    'Loan application submitted',
    (date) => `You applied for a loan on ${date}. Status: Pending review.`,
    'PENDING_REVIEW',
  ),
  LOAN_APPROVED: loanEvent(
    'LOAN_APPROVED',
    'Loan approved',
    (date) => `Your loan request submitted on ${date} has been approved.`,
    'APPROVED',
  ),
  LOAN_REJECTED: loanEvent(
    'LOAN_REJECTED',
    'Loan rejected',
    (date) => `Your loan request submitted on ${date} was rejected.`,
    'REJECTED',
    loanRejectedPayload,
  ),
  LOAN_CANCELLED: loanEvent(
    'LOAN_CANCELLED',
    'Loan cancelled',
    (date) => `Your loan request submitted on ${date} was cancelled.`,
    'CANCELLED',
  ),

  TRAINING_APPLIED: trainingEvent(
    'TRAINING_APPLIED',
    'Training request submitted',
    (date) => `You submitted a training request on ${date}. Status: Pending supervisor approval.`,
    'PENDING',
  ),
  TRAINING_APPROVED: trainingEvent(
    'TRAINING_APPROVED',
    'Training approved',
    (date) => `Your training request submitted on ${date} has been approved.`,
    'APPROVED',
  ),
  TRAINING_REJECTED: trainingEvent(
    'TRAINING_REJECTED',
    'Training rejected',
    (date) => `Your training request submitted on ${date} was rejected.`,
    'REJECTED',
    trainingRejectedPayload,
  ),

  EXIT_APPLIED: exitEvent(
    'EXIT_APPLIED',
    'Exit request submitted',
    (date) => `Your exit request with last working date ${date} has been submitted.`,
    'SUBMITTED',
  ),
  EXIT_APPROVED: exitEvent(
    'EXIT_APPROVED',
    'Exit request approved',
    (date) => `Your exit request with last working date ${date} has been approved.`,
    'APPROVED',
  ),
  EXIT_REJECTED: exitEvent(
    'EXIT_REJECTED',
    'Exit request rejected',
    (date) => `Your exit request with last working date ${date} was rejected.`,
    'REJECTED',
  ),
  EXIT_COMPLETED: exitEvent(
    'EXIT_COMPLETED',
    'Exit clearance completed',
    (date) => `Your exit clearance for last working date ${date} has been completed.`,
    'COMPLETED',
  ),

  RELIEVER_ASSIGNED: defineEvent({
    category: 'RELIEVER',
    audience: 'RELIEVER',
    schema: relieverPayload,
    maxRecipients: 1,
    recipients: (p) => [{ kind: 'employee', employeeId: p.relieverEmployeeId }],
    title: () => 'Reliever assignment',
    message: (p) => `You are covering for ${p.onLeaveEmployeeName} starting ${formatNotificationDate(p.startDate)}.`,
    entity: (p) => ({ type: 'leave', id: String(p.leaveId) }),
    actorUserId: (p) => p.actorUserId ?? null,
    metadata: (p) => ({ startDate: iso(p.startDate), ...(p.endDate ? { endDate: iso(p.endDate) } : {}) }),
    dedupeKey: (p) => keyFor('RELIEVER_ASSIGNED', 'leave', p.leaveId),
  }),

  COMPLAINT_SUBMITTED: complaintEvent(
    'COMPLAINT_SUBMITTED',
    'Complaint submitted',
    (p) => `You submitted a complaint on ${formatNotificationDate(p.submittedAt)} (Ref ${p.reference}). Status: Pending review.`,
    'PENDING_REVIEW',
  ),
  COMPLAINT_APPROVED: complaintEvent(
    'COMPLAINT_APPROVED',
    'Complaint approved',
    (p) => `Your complaint submitted on ${formatNotificationDate(p.submittedAt)} has been approved.`,
    'APPROVED',
  ),
  COMPLAINT_REJECTED: complaintEvent(
    'COMPLAINT_REJECTED',
    'Complaint rejected',
    (p) => `Your complaint submitted on ${formatNotificationDate(p.submittedAt)} was rejected.`,
    'REJECTED',
  ),

  GENERAL_NOTIFICATION: defineEvent({
    category: 'GENERAL',
    audience: 'DIRECT',
    schema: generalPayload,
    maxRecipients: 500,
    recipients: (p) => p.recipientUserIds.map((userId) => ({ kind: 'user' as const, userId })),
    title: (p) => p.title,
    message: (p) => p.message,
    entity: (p) => (p.entity ? { type: p.entity.type, id: String(p.entity.id) } : null),
    actorUserId: (p) => p.actorUserId ?? null,
    metadata: (p) => p.metadata ?? null,
    dedupeKey: (p) => `GENERAL_NOTIFICATION:${p.dedupeKey}`,
  }),
} as const;

export type NotificationEventType = keyof typeof NOTIFICATION_EVENTS;
export const NOTIFICATION_EVENT_TYPES = Object.keys(NOTIFICATION_EVENTS) as NotificationEventType[];

/** The payload a caller passes for an event (dates may be Date objects or ISO strings). */
export type NotificationEventPayload<T extends NotificationEventType> = z.input<(typeof NOTIFICATION_EVENTS)[T]['schema']>;

export const getNotificationEvent = (eventType: string) =>
  Object.prototype.hasOwnProperty.call(NOTIFICATION_EVENTS, eventType)
    ? (NOTIFICATION_EVENTS[eventType as NotificationEventType] as unknown as NotificationEventDefinition<any>)
    : null;
