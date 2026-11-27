import { Transaction } from 'sequelize';
import { db } from '../../db';
import { ApiError } from '../../utils/api-error';
import { Department } from '../department/department.model';
import { identity, requireStageActor } from './staff-movement.authority';
import { isStructuralTransitionAllowed, MovementState, stageAuthority } from './staff-movement.foundation';
import {
  MovementApprovalStage,
  MovementAssignmentSnapshot,
  MovementAudit,
  MovementRequest,
  MovementRequestDetail,
  MovementWorkflow,
  MovementWorkflowVersion,
} from './staff-movement.models';

const reviewStage: Partial<Record<MovementState, string>> = {
  PENDING_HR_VALIDATION: 'HR_PRELIMINARY',
  PENDING_CURRENT_HOD: 'CURRENT_HOD',
  PENDING_RECEIVING_HOD: 'RECEIVING_HOD',
  PENDING_FINAL_HR_REVIEW: 'HR_RECOMMENDATION',
  PENDING_FINAL_APPROVAL: 'HEAD_OF_HR',
};

/** Internal persistence boundary. Edges requiring submission, approval, readiness or execution evidence stay closed. */
export async function transitionMovement(requestId: number, expectedRevision: number, to: MovementState, actorId: number) {
  return db.transaction(async (transaction) => {
    const options = { transaction, lock: transaction.LOCK.UPDATE };
    const request = await MovementRequest.findByPk(requestId, options);
    if (!request) throw ApiError.notFound('Movement request not found');
    const from = request.get('status') as MovementState;
    const revision = Number(request.get('revision'));
    if (revision !== expectedRevision) throw ApiError.conflict('Stale movement revision');
    if (!isStructuralTransitionAllowed(from, to)) throw ApiError.badRequest('Invalid movement transition');
    if (await MovementRequestDetail.findByPk(requestId, options)) throw ApiError.forbidden('Use the movement workflow command');
    const makerId = Number(request.get('initiatedBy'));
    if (from === 'DRAFT' && to === 'WITHDRAWN') {
      if (makerId !== actorId || !(await identity(actorId, transaction)))
        throw ApiError.forbidden('Eligible request maker required');
    } else {
      const stageCode = reviewStage[from];
      if (!stageCode || !['RETURNED', 'CLARIFICATION', 'REJECTED'].includes(to))
        throw ApiError.forbidden('Required workflow evidence is unavailable');
      const versionId = Number(request.get('workflowVersionId'));
      const version = await MovementWorkflowVersion.findByPk(versionId, options);
      const workflow = version && (await MovementWorkflow.findByPk(Number(version.get('workflowId')), options));
      const stage = await MovementApprovalStage.findOne({ where: { versionId, stageCode }, ...options });
      const snapshot = await MovementAssignmentSnapshot.findOne({
        where: { requestId, kind: stageCode === 'RECEIVING_HOD' ? 'PROPOSED' : 'CURRENT' },
        ...options,
      });
      const departmentId = (snapshot?.get('assignment') as { departmentId?: number } | undefined)?.departmentId;
      const department = departmentId && (await Department.findByPk(departmentId, options));
      if (
        !stage ||
        stage.get('authority') !== stageAuthority[stageCode] ||
        !department ||
        !workflow ||
        !['ACTIVE', 'RETIRED'].includes(String(version?.get('status'))) ||
        (workflow.get('companyId') != null && workflow.get('companyId') !== department.companyId) ||
        workflow.get('categoryId') !== request.get('categoryId')
      )
        throw ApiError.forbidden('Incomplete historical approval scope');
      await requireStageActor(
        {
          actorId,
          makerId,
          subjectId: Number(request.get('employeeId')),
          department,
          role: String(stage.get('authority')),
          stageScope: String(stage.get('scope')),
        },
        transaction,
      );
    }
    return persistMovementTransition(requestId, from, to, revision, actorId, transaction);
  });
}

/** Shared compare-and-swap and audit write, after the calling command has verified its edge and evidence. */
export async function persistMovementTransition(
  requestId: number,
  from: MovementState,
  to: MovementState,
  revision: number,
  actorId: number,
  transaction: Transaction,
  options: { effectiveDate?: string; versionId?: number; audit?: Record<string, unknown> } = {},
) {
  const command = options.audit?.action;
  const resume = command === 'RESUBMIT' && ['RETURNED', 'CLARIFICATION'].includes(from) && to.startsWith('PENDING_');
  const capturedEndorsement =
    (command === 'FORWARD' && from === 'PENDING_HR_VALIDATION' && to === 'PENDING_RECEIVING_HOD') ||
    (['ENDORSE', 'CONDITIONAL_RELEASE', 'RESOLVE'].includes(String(command)) &&
      from === 'PENDING_CURRENT_HOD' &&
      to === 'PENDING_FINAL_HR_REVIEW');
  const sameStage =
    from === to &&
    (['EDIT', 'ASSIGN_HR'].includes(String(command)) ||
      (from === 'PENDING_CURRENT_HOD' && ['OBJECT', 'ESCALATE'].includes(String(command))) ||
      (from === 'PENDING_ADDITIONAL_APPROVAL' && command === 'APPROVE'));
  if (!isStructuralTransitionAllowed(from, to) && !sameStage && !capturedEndorsement && !resume)
    throw ApiError.conflict('Invalid persisted movement transition');
  if (options.versionId && from !== 'DRAFT') throw ApiError.conflict('Submitted workflow is immutable');
  // The request model prohibits generic updates. This locked conditional write owns state and revision together.
  const [, affected] = await db.query(
    'UPDATE sm_requests SET status = :to, effective_date = COALESCE(:effectiveDate, effective_date), workflow_version_id = COALESCE(:versionId, workflow_version_id), revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE id = :requestId AND status = :from AND revision = :revision',
    {
      replacements: {
        requestId,
        from,
        to,
        revision,
        effectiveDate: options.effectiveDate ?? null,
        versionId: options.versionId ?? null,
      },
      transaction,
    },
  );
  if ((affected as unknown as { affectedRows: number }).affectedRows !== 1)
    throw ApiError.conflict('Movement changed concurrently');
  await MovementAudit.create(
    {
      actorUserId: actorId,
      resource: 'sm_requests',
      recordId: requestId,
      action: 'TRANSITION',
      changes: { from, to, revision: revision + 1, ...options.audit },
    },
    { transaction },
  );
  return { status: to, revision: revision + 1 };
}
