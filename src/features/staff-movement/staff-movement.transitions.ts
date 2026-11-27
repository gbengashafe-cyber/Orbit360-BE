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
    // The request model prohibits generic updates. This locked conditional write owns state and revision together.
    const [, affected] = await db.query(
      'UPDATE sm_requests SET status = :to, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE id = :requestId AND status = :from AND revision = :revision',
      { replacements: { requestId, from, to, revision }, transaction },
    );
    if ((affected as unknown as { affectedRows: number }).affectedRows !== 1)
      throw ApiError.conflict('Movement changed concurrently');
    await MovementAudit.create(
      {
        actorUserId: actorId,
        resource: 'sm_requests',
        recordId: requestId,
        action: 'TRANSITION',
        changes: { from, to, revision: revision + 1 },
      },
      { transaction },
    );
    return { status: to, revision: revision + 1 };
  });
}
