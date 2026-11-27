import { strict as assert } from 'node:assert';
import { after, mock, test } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { get } from 'node:http';
import { QueryTypes } from 'sequelize';
import { startServer, authHeadersFor } from '../../notifications/__tests__/test-helpers';
import { db } from '../../../db';
import { configurationHandlers } from '../staff-movement.configuration';
import { StaffMovementService } from '../staff-movement.service';

after(async () => {
  mock.restoreAll();
  await db.close();
});

async function invoke(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>, params: object, body: object) {
  let output: unknown;
  let error: unknown;
  await handler(
    { params, body, user: { id: 1 } } as Request,
    {
      json(value: unknown) {
        output = value;
      },
    } as Response,
    ((value: unknown) => {
      error = value;
    }) as NextFunction,
  );
  return { output, error };
}

test('configuration handler validates input and calls the persistence service', async () => {
  const boundary = mock.method(
    StaffMovementService,
    'configure',
    async (_id: number, action: (s: StaffMovementService) => Promise<never>) => action(StaffMovementService.prototype),
  );
  const create = mock.method(StaffMovementService.prototype, 'createWorkflow', async () => ({ id: 5 }) as never);
  try {
    const good = await invoke(configurationHandlers.create, { resource: 'workflows' }, { categoryId: 2, name: 'Routine' });
    assert.equal(good.error, undefined);
    assert.equal(create.mock.callCount(), 1);
    const bad = await invoke(
      configurationHandlers.create,
      { resource: 'workflows' },
      { categoryId: 2, name: 'Routine', admin: true },
    );
    assert.ok(bad.error);
    assert.equal(create.mock.callCount(), 1);
  } finally {
    create.mock.restore();
    boundary.mock.restore();
  }
});

test('configuration updates reject mutations to historical workflow versions and unsupported fields', async () => {
  const boundary = mock.method(
    StaffMovementService,
    'configure',
    async (_id: number, action: (s: StaffMovementService) => Promise<never>) => action(StaffMovementService.prototype),
  );
  const bad = await invoke(configurationHandlers.update, { resource: 'workflows', id: '1' }, { categoryId: 2 });
  assert.ok(bad.error);
  await assert.rejects(() => StaffMovementService.prototype.update('versions', 1, { name: 'changed' }));
  boundary.mock.restore();
});

test('configuration fails closed without an eligible manager', async () => {
  await assert.rejects(
    StaffMovementService.configure(-1, (s) => s.list('categories')),
    /permission/,
  );
});

test('mounted configuration paths require authentication and current movement permission', async () => {
  const server = await startServer();
  try {
    const path = new URL('/api/v1/staff-movement/configuration/categories', server.baseUrl);
    const status = (headers = {}) =>
      new Promise<number | undefined>((resolve, reject) => {
        get(path, { headers, agent: false }, (response) => {
          response.resume();
          response.on('end', () => resolve(response.statusCode));
        }).on('error', reject);
      });
    assert.equal(await status(), 401);
    const [user] = await db.query<{ id: number }>(
      "SELECT u.id FROM users u WHERE u.deleted_at IS NULL AND u.status = 'ACTIVE' AND NOT EXISTS (SELECT 1 FROM job_role_permissions p WHERE p.job_role_id = u.job_role_id AND p.permission = 'MANAGE_STAFF_MOVEMENT_CONFIGURATION') LIMIT 1",
      { type: QueryTypes.SELECT },
    );
    assert.ok(user);
    assert.equal(await status(authHeadersFor(user.id)), 403);
  } finally {
    await server.close();
  }
});
