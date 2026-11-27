'use strict';

const legacyIndex = 'sm_one_active_request_employee_uq';
const slotIndex = 'sm_request_employee_active_slot_uq';
const terminal = "'COMPLETED','REJECTED','WITHDRAWN','CANCELLED'";
const expression = `CASE WHEN status IN (${terminal}) THEN NULL ELSE 1 END`;

function requireShape(condition, message) {
  if (!condition) throw new Error('Staff Movement migration stopped: ' + message);
}

function verifySlot(column) {
  // MySQL serializes CASE/IN with identifier quoting, parentheses and character-set introducers.
  const sql = column.GENERATION_EXPRESSION.replace(/_utf8mb4\\'([A-Z_]+)\\'/g, "'$1'")
    .replace(/_utf8mb4(?=')/gi, '')
    .replace(/`status`/gi, 'status');
  const pattern = /^\s*\(?case\s+when\s+\(?status\s+in\s*\(([^)]*)\)\)?\s+then\s+null\s+else\s+1\s+end\)?\s*$/i;
  const values = pattern
    .exec(sql)?.[1]
    .split(',')
    .map((part) => part.trim())
    .join(',');
  requireShape(
    column.COLUMN_TYPE === 'tinyint' &&
      column.IS_NULLABLE === 'YES' &&
      column.EXTRA === 'VIRTUAL GENERATED' &&
      values === terminal,
    'unexpected active_slot definition: ' + sql,
  );
}

function verifyIndex(rows, expected) {
  requireShape(
    rows.length === expected.length &&
      rows.every(
        (row, i) =>
          row.COLUMN_NAME === expected[i] &&
          Number(row.SEQ_IN_INDEX) === i + 1 &&
          Number(row.NON_UNIQUE) === 0 &&
          row.SUB_PART === null &&
          row.INDEX_TYPE === 'BTREE' &&
          row.COLLATION === 'A' &&
          row.IS_VISIBLE === 'YES',
      ),
    'unexpected unique index on ' + expected.join(', '),
  );
}

// The test suite runs this same recovery against private fixture tables in the local schema.
async function installConstraint(q, table) {
  const name = q.quoteIdentifier(table);
  const read = async (sql) => (await q.sequelize.query(sql, { replacements: { table } }))[0];
  const columns = () =>
    read(
      'SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, GENERATION_EXPRESSION FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:table',
    );
  const indexes = () =>
    read(
      'SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE, SUB_PART, INDEX_TYPE, COLLATION, IS_VISIBLE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:table ORDER BY INDEX_NAME, SEQ_IN_INDEX',
    );
  const cols = await columns();
  const find = (key) => cols.find((col) => col.COLUMN_NAME === key);
  const keys = await indexes();
  const engine = await read('SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:table');
  requireShape(
    engine[0]?.ENGINE === 'InnoDB' &&
      find('employee_id')?.COLUMN_TYPE === 'int' &&
      find('employee_id').IS_NULLABLE === 'NO' &&
      find('status')?.COLUMN_TYPE === 'varchar(40)' &&
      find('status').IS_NULLABLE === 'NO',
    'unexpected base table',
  );
  const legacy = find('active_employee_id');
  const oldKey = keys.filter((k) => k.INDEX_NAME === legacyIndex);
  if (oldKey.length) verifyIndex(oldKey, ['active_employee_id']);
  if (legacy) {
    requireShape(
      legacy.COLUMN_TYPE === 'int' &&
        legacy.IS_NULLABLE === 'YES' &&
        legacy.COLUMN_DEFAULT === null &&
        !legacy.EXTRA &&
        !legacy.GENERATION_EXPRESSION,
      'unexpected legacy column',
    );
    requireShape(
      !keys.some((k) => k.COLUMN_NAME === 'active_employee_id' && k.INDEX_NAME !== legacyIndex) &&
        !cols.some((c) => /active_employee_id/i.test(c.GENERATION_EXPRESSION)),
      'legacy column has another dependent object',
    );
    const references = await read(`SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE
      (REFERENCED_TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME=:table AND REFERENCED_COLUMN_NAME='active_employee_id')
      OR (TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:table AND COLUMN_NAME='active_employee_id' AND REFERENCED_TABLE_NAME IS NOT NULL)`);
    const views = await read(
      'SELECT 1 FROM information_schema.VIEW_TABLE_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:table',
    );
    requireShape(!references.length && !views.length, 'legacy dependencies require review');
  }
  requireShape(
    !(await read('SELECT 1 FROM information_schema.TRIGGERS WHERE EVENT_OBJECT_SCHEMA=DATABASE() AND EVENT_OBJECT_TABLE=:table'))
      .length,
    'existing triggers require a separate forward migration',
  );
  if (find('active_slot')) verifySlot(find('active_slot'));
  const newKey = keys.filter((k) => k.INDEX_NAME === slotIndex);
  if (newKey.length) verifyIndex(newKey, ['employee_id', 'active_slot']);
  requireShape(
    !(await read(`SELECT 1 FROM ${name} WHERE status NOT IN (${terminal}) GROUP BY employee_id HAVING COUNT(*) > 1 LIMIT 1`))
      .length,
    'conflicting active requests',
  );

  if (!find('active_slot'))
    await q.sequelize.query(`ALTER TABLE ${name} ADD COLUMN active_slot TINYINT GENERATED ALWAYS AS (${expression}) VIRTUAL`);
  verifySlot((await columns()).find((col) => col.COLUMN_NAME === 'active_slot'));
  if (!newKey.length) await q.sequelize.query(`ALTER TABLE ${name} ADD UNIQUE INDEX ${slotIndex} (employee_id, active_slot)`);
  verifyIndex(
    (await indexes()).filter((k) => k.INDEX_NAME === slotIndex),
    ['employee_id', 'active_slot'],
  );
  if (legacy) {
    const drops = oldKey.length ? `DROP INDEX ${legacyIndex}, ` : '';
    await q.sequelize.query(`ALTER TABLE ${name} ${drops}DROP COLUMN active_employee_id`);
  }
}
module.exports = {
  installConstraint,
  up: (q) => installConstraint(q, 'sm_requests'),
  async down() {
    throw new Error('Removing active-request uniqueness requires a reviewed replacement with movement writers stopped');
  },
};
