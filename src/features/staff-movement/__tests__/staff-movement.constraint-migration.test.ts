import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { db } from '../../../db';

const migration = require('../../../../migrations/20261126161000-staff-movement-active-request-constraint.cjs');
const q = db.getQueryInterface();
after(() => db.close());

for (const state of [
  'clean',
  'partial',
  'column-created',
  'index-created',
  'wrong-expression',
  'wrong-index',
  'duplicate-data',
]) {
  test('active-slot migration on MySQL: ' + state, async () => {
    assert.equal(db.config.database, 'orbit360_dev');
    assert.ok(['localhost', '127.0.0.1', '::1'].includes(String(db.config.host)));
    const table = 'test_sm_' + randomUUID().replace(/-/g, '');
    const sql = (statement: string) => db.query(statement.replace(/FIXTURE/g, table));
    await sql(
      'CREATE TABLE FIXTURE (id INT PRIMARY KEY AUTO_INCREMENT, employee_id INT NOT NULL, status VARCHAR(40) NOT NULL) ENGINE=InnoDB',
    );
    try {
      if (state !== 'clean')
        await sql(
          'ALTER TABLE FIXTURE ADD active_employee_id INT NULL, ADD UNIQUE INDEX sm_one_active_request_employee_uq(active_employee_id)',
        );
      const createSlot =
        "ALTER TABLE FIXTURE ADD active_slot TINYINT AS (CASE WHEN status IN ('COMPLETED','REJECTED','WITHDRAWN','CANCELLED') THEN NULL ELSE 1 END) VIRTUAL";
      if (['column-created', 'index-created', 'wrong-index'].includes(state)) await sql(createSlot);
      if (state === 'index-created')
        await sql('ALTER TABLE FIXTURE ADD UNIQUE INDEX sm_request_employee_active_slot_uq(employee_id,active_slot)');
      if (state === 'wrong-expression') await sql(createSlot.replace('THEN NULL ELSE 1', 'THEN 1 ELSE NULL'));
      if (state === 'wrong-index')
        await sql('ALTER TABLE FIXTURE ADD INDEX sm_request_employee_active_slot_uq(active_slot,employee_id)');
      await sql("INSERT INTO FIXTURE(employee_id,status) VALUES (1,'DRAFT'),(1,'WITHDRAWN')");
      if (state === 'duplicate-data') await sql("INSERT INTO FIXTURE(employee_id,status) VALUES (1,'RETURNED')");
      if (['wrong-expression', 'wrong-index', 'duplicate-data'].includes(state)) {
        await assert.rejects(migration.installConstraint(q, table), /unexpected|conflicting/);
        await sql('SELECT active_employee_id FROM FIXTURE');
        return;
      }
      await migration.installConstraint(q, table);
      await migration.installConstraint(q, table);
      const [rows] = await sql('SELECT active_slot FROM FIXTURE ORDER BY id');
      assert.deepEqual(rows, [{ active_slot: 1 }, { active_slot: null }]);
      assert.ok(!('active_employee_id' in (await q.describeTable(table))));
      await assert.rejects(sql("INSERT INTO FIXTURE(employee_id,status) VALUES (1,'RETURNED')"), (err: Error) => {
        const cause = (err as Error & { original: { code: string; sqlMessage: string } }).original;
        return cause?.code === 'ER_DUP_ENTRY' && /sm_request_employee_active_slot_uq'/.test(cause.sqlMessage);
      });
    } finally {
      await q.dropTable(table);
    }
  });
}
