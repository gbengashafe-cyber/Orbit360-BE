import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  isStructuralTransitionAllowed,
  MOVEMENT_CATEGORIES,
  REQUIRED_APPROVAL_STAGES,
  validateApprovalStages,
} from '../staff-movement.foundation';

test('approved movement categories have distinct stable identifiers', () => {
  assert.equal(MOVEMENT_CATEGORIES.length, 8);
  assert.equal(new Set(MOVEMENT_CATEGORIES).size, 8);
});

test('configuration requires all mandatory approvals in order', () => {
  assert.equal(validateApprovalStages(REQUIRED_APPROVAL_STAGES), true);
  assert.equal(validateApprovalStages([...REQUIRED_APPROVAL_STAGES, 'EXECUTIVE']), true);
  assert.equal(validateApprovalStages(['HEAD_OF_HR']), false);
  assert.equal(validateApprovalStages([...REQUIRED_APPROVAL_STAGES].reverse()), false);
  assert.equal(validateApprovalStages([...REQUIRED_APPROVAL_STAGES, 'UNKNOWN']), false);
  assert.equal(validateApprovalStages([...REQUIRED_APPROVAL_STAGES, 'HEAD_OF_HR']), false);
});

test('structural transitions reject skipped approval and changes to completed records', () => {
  assert.equal(isStructuralTransitionAllowed('DRAFT', 'SUBMITTED'), true);
  assert.equal(isStructuralTransitionAllowed('DRAFT', 'APPROVED'), false);
  assert.equal(isStructuralTransitionAllowed('COMPLETED', 'DRAFT'), false);
  assert.equal(isStructuralTransitionAllowed('APPROVED', 'COMPLETED'), false);
});
