import { strict as assert } from 'node:assert';
import { after, test } from 'node:test';
import { db } from '../../../db';
import { MovementCategory, MovementWorkflow, MovementWorkflowVersion, MovementApprovalStage } from '../staff-movement.models';

after(async () => {
  await db.close();
});

test('migration creates required tables and foreign key constraints', async () => {
  const [tables] = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'sm_%'",
  );
  const [keys] = await db.query(
    "SELECT constraint_name FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name LIKE 'sm_%'",
  );
  assert.equal(tables.length, 18);
  assert.ok(keys.length >= 20);
});

test('database has the eight approved reference categories', async () => {
  const categories = await MovementCategory.findAll();
  assert.equal(categories.length, 8);
  assert.ok(categories.some((category) => category.get('code') === 'SECONDMENT'));
});

test('workflow versions and stages persist with relationships and enforce uniqueness', async () => {
  const transaction = await db.transaction();
  try {
    const category = await MovementCategory.findOne({ transaction });
    assert.ok(category);
    const workflow = await MovementWorkflow.create(
      { categoryId: category.get('id'), name: 'Isolated regression', active: true },
      { transaction },
    );
    const version = await MovementWorkflowVersion.create(
      { workflowId: workflow.get('id'), version: 1, status: 'DRAFT', settings: {} },
      { transaction },
    );
    await MovementApprovalStage.create(
      {
        versionId: version.get('id'),
        stageOrder: 1,
        stageCode: 'HR_PRELIMINARY',
        authority: 'HR',
        scope: 'ORG',
        mandatory: true,
        settings: {},
      },
      { transaction },
    );
    const loaded = await MovementWorkflowVersion.findByPk(Number(version.get('id')), {
      include: [{ model: MovementApprovalStage, as: 'stages' }],
      transaction,
    });
    assert.equal((loaded?.get('stages') as unknown[]).length, 1);
    await assert.rejects(() =>
      MovementWorkflowVersion.create(
        { workflowId: workflow.get('id'), version: 1, status: 'DRAFT', settings: {} },
        { transaction },
      ),
    );
  } finally {
    await transaction.rollback();
  }
});
