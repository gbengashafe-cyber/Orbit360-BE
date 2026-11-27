import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createConnection, Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { env } from '../../../config/env';
import { MOVEMENT_STATES } from '../staff-movement.foundation';

const terminal = new Set(['COMPLETED', 'REJECTED', 'WITHDRAWN', 'CANCELLED']);
const connections: Connection[] = [];
let admin: Connection, first: Connection, second: Connection;
let category: number, maker: number, workflow: number, version: number;
const employees: number[] = [];
const tag = randomUUID().slice(0, 8);
const insertId = async (db: Connection, sql: string, values: (string | number)[]) =>
  (await db.execute<ResultSetHeader>(sql, values))[0].insertId;
const request = (db: Connection, employee: number, status = 'DRAFT') =>
  insertId(
    db,
    'INSERT INTO sm_requests(employee_id,category_id,workflow_version_id,initiated_by,status,effective_date,created_at,updated_at) VALUES (?,?,?,?,?,CURRENT_DATE,NOW(),NOW())',
    [employee, category, version, maker, status],
  );

before(async () => {
  assert.equal(env.DB_NAME, 'orbit360_dev');
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(env.DB_HOST_NAME));
  for (let i = 0; i < 3; i++)
    connections.push(
      await createConnection({
        host: env.DB_HOST_NAME,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
      }),
    );
  [admin, first, second] = connections;
  assert.equal(new Set(connections.map((c) => c.threadId)).size, 3);
  const [parents] = await admin.query<RowDataPacket[]>(
    'SELECT company_id,department_id,job_role_id,created_by FROM employees LIMIT 1',
  );
  assert.ok(parents.length, 'Local employee organization fixture required');
  const parent = parents[0];
  maker = parent.created_by;
  category = (await admin.query<RowDataPacket[]>('SELECT id FROM sm_categories LIMIT 1'))[0][0].id;
  workflow = await insertId(
    admin,
    'INSERT INTO sm_workflows(category_id,name,active,created_at,updated_at) VALUES (?,?,0,NOW(),NOW())',
    [category, tag],
  );
  version = await insertId(
    admin,
    "INSERT INTO sm_workflow_versions(workflow_id,version,status,settings,created_at,updated_at) VALUES (?,1,'DRAFT',JSON_OBJECT(),NOW(),NOW())",
    [workflow],
  );
  for (const n of [1, 2, 3])
    employees.push(
      await insertId(
        admin,
        "INSERT INTO employees(company_id,department_id,job_role_id,created_by,staff_id,email,first_name,last_name,phone,dob,hire_date,annual_basic_salary,nhf_applicable,created_at,updated_at) VALUES (?,?,?,?,?,?,'Test','Fixture','000','1990-01-01','2020-01-01',0,0,NOW(),NOW())",
        [parent.company_id, parent.department_id, parent.job_role_id, maker, tag + n, tag + n + '@example.invalid'],
      ),
    );
});

after(async () => {
  try {
    await first?.rollback();
    await second?.rollback();
    if (version) {
      await admin.execute('DELETE FROM sm_requests WHERE workflow_version_id=?', [version]);
      await admin.execute('DELETE FROM sm_workflow_versions WHERE id=?', [version]);
    }
    if (workflow) await admin.execute('DELETE FROM sm_workflows WHERE id=?', [workflow]);
    for (const employee of employees) await admin.execute('DELETE FROM employees WHERE id=?', [employee]);
  } finally {
    await Promise.all(connections.map((c) => c.end()));
  }
});

const duplicate = (error: unknown) => {
  const cause = error as { code?: string; sqlMessage?: string };
  return cause?.code === 'ER_DUP_ENTRY' && /sm_request_employee_active_slot_uq'/.test(cause.sqlMessage ?? '');
};

// Observe the second INSERT executing on the server before releasing the first transaction.
async function waitForContender() {
  const deadline = Date.now() + 5000;
  do {
    const [sessions] = await admin.query<RowDataPacket[]>('SHOW FULL PROCESSLIST');
    if (sessions.some((s) => s.Id === second.threadId && /^INSERT INTO sm_requests/i.test(s.Info ?? ''))) return;
    await delay(10);
  } while (Date.now() < deadline);
  throw Error('Competing INSERT did not overlap the holder');
}

for (const operation of ['active insert', 'terminal transition']) {
  for (const outcome of ['commit', 'rollback'] as const) {
    test(operation + ' followed by ' + outcome + ' while another connection claims the same employee', async () => {
      const employee = employees[0];
      const prior = operation === 'terminal transition' ? await request(admin, employee) : undefined;
      try {
        await first.beginTransaction();
        if (prior) await first.execute("UPDATE sm_requests SET status='WITHDRAWN' WHERE id=?", [prior]);
        else await request(first, employee);
        await second.beginTransaction();
        const contender = request(second, employee).then(
          (id) => ({ id, error: undefined }),
          (error: unknown) => ({ id: 0, error }),
        );
        await waitForContender();
        await first[outcome]();
        const result = await contender;
        const succeeds = prior ? outcome === 'commit' : outcome === 'rollback';
        if (succeeds) {
          assert.ifError(result.error);
          assert.ok(result.id);
          await second.commit();
        } else {
          assert.ok(duplicate(result.error), String(result.error));
          await second.rollback();
        }
        const [counts] = await admin.execute<RowDataPacket[]>(
          'SELECT COUNT(*) n FROM sm_requests WHERE employee_id=? AND active_slot=1',
          [employee],
        );
        assert.equal(counts[0].n, 1);
      } finally {
        await first.rollback();
        await second.rollback();
        await admin.execute('DELETE FROM sm_requests WHERE workflow_version_id=? AND employee_id=?', [version, employee]);
      }
    });
  }
}
test('independent employees can hold active requests concurrently', async () => {
  await first.beginTransaction();
  try {
    await request(first, employees[1]);
    await second.beginTransaction();
    await request(second, employees[2]);
    await second.commit();
    await first.commit();
  } finally {
    await first.rollback();
    await second.rollback();
    await admin.execute('DELETE FROM sm_requests WHERE workflow_version_id=?', [version]);
  }
});

test('overlapping writers for different employees can both commit after prior slot use', async () => {
  await first.beginTransaction();
  await second.beginTransaction();
  try {
    await request(first, employees[0]);
    // The holder can commit independently even when InnoDB temporarily blocks the other insert.
    const [id] = await Promise.all([request(second, employees[1]), first.commit()]);
    assert.ok(id);
    await second.commit();
    const [rows] = await admin.execute<RowDataPacket[]>(
      'SELECT COUNT(DISTINCT employee_id) n FROM sm_requests WHERE workflow_version_id=? AND active_slot=1',
      [version],
    );
    assert.equal(rows[0].n, 2);
  } finally {
    await first.rollback();
    await second.rollback();
    await admin.execute('DELETE FROM sm_requests WHERE workflow_version_id=?', [version]);
  }
});

test('every approved state derives the slot on SQL writes and preserves terminal history', async () => {
  await first.beginTransaction();
  try {
    const employee = employees[0];
    const id = await request(first, employee);
    for (const status of MOVEMENT_STATES) {
      await first.execute('UPDATE sm_requests SET status=? WHERE id=?', [status, id]);
      const [rows] = await first.execute<RowDataPacket[]>('SELECT active_slot FROM sm_requests WHERE id=?', [id]);
      assert.equal(rows[0].active_slot, terminal.has(status) ? null : 1, status);
      if (terminal.has(status)) {
        const another = await request(first, employee);
        await first.execute('UPDATE sm_requests SET status=? WHERE id=?', [status, another]);
      } else await assert.rejects(request(first, employee), duplicate);
    }
    await assert.rejects(first.execute('UPDATE sm_requests SET active_slot=NULL WHERE id=?', [id]), {
      code: 'ER_NON_DEFAULT_VALUE_FOR_GENERATED_COLUMN',
    });
    const [history] = await first.execute<RowDataPacket[]>(
      'SELECT COUNT(*) n FROM sm_requests WHERE employee_id=? AND active_slot IS NULL',
      [employee],
    );
    assert.equal(history[0].n, terminal.size);
  } finally {
    await first.rollback();
  }
});
