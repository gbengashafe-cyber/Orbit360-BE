import { z } from 'zod';
import { formatNotificationDate } from './notification.dates';
import {
  NOTIFICATION_ENTITY_TYPES,
  NotificationAudience,
  NotificationCategory,
  NotificationEntityType,
} from './notification.model';
import { RecipientRef } from './notification.recipients';

/**
 * Central registry of notification events.
 *
 * Each definition owns everything about one event: its category, audience, the payload it expects,
 * who receives it, its title and message copy, the record it points to, its metadata and its idempotency key.
 * Workflows will only ever call `NotificationService.notify(eventType, payload)` (wired up in Phase 3).
 *
 * Phase 2 defines employee-facing events only (requester, reliever, direct). Approver audiences
 * (supervisor / HR Officer / HR Manager / Super Admin) are deferred (D4) and are added later as new
 * definitions with audience ACTOR_QUEUE, without changing this structure.
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
export const NOTIFICATION_EVENTS = {
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
