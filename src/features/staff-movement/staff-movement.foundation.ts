/** Phase 1 domain definitions. These do not authorize or execute workflow decisions. */
export const MOVEMENT_CATEGORIES = [
  'INTERDEPARTMENTAL_TRANSFER',
  'INTERBRANCH_TRANSFER',
  'LOCATION_TRANSFER',
  'JOB_ROTATION',
  'REDEPLOYMENT',
  'SECONDMENT',
  'PROMOTION_RELATED',
  'INTRAGROUP_TRANSFER',
] as const;

export const MOVEMENT_STATES = [
  'DRAFT',
  'SUBMITTED',
  'PENDING_HR_VALIDATION',
  'PENDING_CURRENT_HOD',
  'PENDING_RECEIVING_HOD',
  'PENDING_FINAL_HR_REVIEW',
  'PENDING_FINAL_APPROVAL',
  'PENDING_ADDITIONAL_APPROVAL',
  'RETURNED',
  'CLARIFICATION',
  'APPROVED',
  'SCHEDULED',
  'COMPLETED',
  'REJECTED',
  'WITHDRAWN',
  'CANCELLED',
  'IMPLEMENTATION_FAILED',
] as const;
export type MovementState = (typeof MOVEMENT_STATES)[number];

// This is only a structural guard: future services must also check actor, version and readiness.
const transitions: Record<MovementState, readonly MovementState[]> = {
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['PENDING_HR_VALIDATION'],
  PENDING_HR_VALIDATION: ['PENDING_CURRENT_HOD', 'RETURNED', 'REJECTED'],
  PENDING_CURRENT_HOD: ['PENDING_RECEIVING_HOD', 'RETURNED'],
  PENDING_RECEIVING_HOD: ['PENDING_FINAL_HR_REVIEW', 'RETURNED', 'REJECTED'],
  PENDING_FINAL_HR_REVIEW: ['PENDING_FINAL_APPROVAL', 'RETURNED'],
  PENDING_FINAL_APPROVAL: ['PENDING_ADDITIONAL_APPROVAL', 'APPROVED', 'RETURNED', 'CLARIFICATION', 'REJECTED'],
  PENDING_ADDITIONAL_APPROVAL: ['APPROVED', 'RETURNED', 'CLARIFICATION', 'REJECTED'],
  RETURNED: [],
  CLARIFICATION: [],
  APPROVED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['COMPLETED', 'IMPLEMENTATION_FAILED', 'CANCELLED'],
  IMPLEMENTATION_FAILED: ['SCHEDULED', 'COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  WITHDRAWN: [],
  CANCELLED: [],
};

export function isStructuralTransitionAllowed(from: MovementState, to: MovementState): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export const REQUIRED_APPROVAL_STAGES = [
  'HR_PRELIMINARY',
  'CURRENT_HOD',
  'RECEIVING_HOD',
  'HR_RECOMMENDATION',
  'HEAD_OF_HR',
] as const;
export type RequiredApprovalStage = (typeof REQUIRED_APPROVAL_STAGES)[number];

/** Mandatory stages must occur exactly once and in order; optional stages follow the final authority. */
export function validateApprovalStages(stages: readonly string[]): boolean {
  const mandatory = stages.filter((stage) => (REQUIRED_APPROVAL_STAGES as readonly string[]).includes(stage));
  if (
    mandatory.length !== REQUIRED_APPROVAL_STAGES.length ||
    !mandatory.every((stage, index) => stage === REQUIRED_APPROVAL_STAGES[index])
  )
    return false;
  const headIndex = stages.indexOf('HEAD_OF_HR');
  return (
    stages.every(
      (stage, index) =>
        (REQUIRED_APPROVAL_STAGES as readonly string[]).includes(stage) ||
        (index > headIndex && (stage === 'EXECUTIVE' || stage === 'FINANCIAL')),
    ) && new Set(stages).size === stages.length
  );
}

export const stageAuthority: Record<string, string> = {
  HR_PRELIMINARY: 'HR_OFFICER',
  CURRENT_HOD: 'CURRENT_HOD',
  RECEIVING_HOD: 'RECEIVING_HOD',
  HR_RECOMMENDATION: 'HR_OFFICER',
  HEAD_OF_HR: 'HEAD_OF_HR',
  EXECUTIVE: 'EXECUTIVE',
  FINANCIAL: 'FINANCIAL',
};
