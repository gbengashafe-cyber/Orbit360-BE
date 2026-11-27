import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { validateAuthToken } from '../authentication/auth.middleware';
import { StaffMovementService } from './staff-movement.service';

import { hasRequiredPermission } from '../../utils/check-permission';
const router = Router();
router.use(validateAuthToken);
router.use(hasRequiredPermission('MANAGE_STAFF_MOVEMENT_CONFIGURATION'));

const id = z.coerce.number().int().positive();
const name = z.string().trim().min(1).max(120);
const code = z.string().trim().min(1).max(60);
const date = z.iso.date();
const object = z.record(z.string(), z.unknown());
const stage = z.strictObject({ stageCode: code, authority: code, scope: code, mandatory: z.boolean(), settings: object });
const workflowIds = z.strictObject({ workflowId: id, versionId: id });
const resource = z.enum([
  'categories',
  'workflows',
  'branches',
  'locations',
  'grades',
  'costCentres',
  'legalEntities',
  'positions',
  'headcounts',
  'hodAssignments',
  'approverAssignments',
  'delegations',
]);
const bodySchemas = {
  workflows: z.strictObject({ categoryId: id, name }),
  branches: z.strictObject({ companyId: id, code, name }),
  locations: z.strictObject({ companyId: id, code, name }),
  grades: z.strictObject({ companyId: id, code, name }),
  costCentres: z.strictObject({ companyId: id, code, name }),
  legalEntities: z.strictObject({ companyId: id, code, name }),
  positions: z.strictObject({ departmentId: id, jobRoleId: id, code, name }),
  headcounts: z.strictObject({
    departmentId: id,
    positionId: id,
    approvedCount: z.number().int().nonnegative(),
    effectiveFrom: date,
    effectiveTo: date.nullable().optional(),
  }),
  hodAssignments: z.strictObject({
    departmentId: id,
    employeeId: id,
    startsOn: date,
    endsOn: date.nullable().optional(),
    acting: z.boolean(),
  }),
  approverAssignments: z.strictObject({
    departmentId: id.nullable().optional(),
    userId: id,
    authority: z.enum(['HR_OFFICER', 'HEAD_OF_HR', 'EXECUTIVE', 'FINANCIAL']),
    startsOn: date,
    endsOn: date.nullable().optional(),
  }),
  delegations: z.strictObject({
    principalUserId: id,
    delegateUserId: id,
    departmentId: id,
    scope: code,
    startsOn: date,
    endsOn: date,
  }),
};
type CreateResource = keyof typeof bodySchemas;
const masterKinds = {
  branches: 'branch',
  locations: 'location',
  grades: 'grade',
  costCentres: 'costCentre',
  legalEntities: 'legalEntity',
} as const;
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw ApiError.badRequest('Invalid Staff Movement configuration input');
  return result.data;
};
const run =
  (action: (req: Request, service: StaffMovementService) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw ApiError.unauthenticated('Authentication required');
      const data = await StaffMovementService.configure(req.user.id, (service) => action(req, service));
      res.json(ApiResponse({ data: data as object }));
    } catch (error) {
      next(error);
    }
  };

export const configurationHandlers = {
  list: run(async (req, service) => service.list(parse(resource, req.params.resource))),
  get: run(async (req, service) => service.get(parse(resource, req.params.resource), parse(id, req.params.id))),
  create: run(async (req, service) => {
    const type = parse(resource, req.params.resource);
    if (!(type in bodySchemas)) throw ApiError.badRequest('Creation is not supported for this resource');
    const input: unknown = parse(bodySchemas[type as CreateResource] as z.ZodType<unknown>, req.body);
    switch (type) {
      case 'workflows': {
        const v = input as z.infer<typeof bodySchemas.workflows>;
        return service.createWorkflow(v.categoryId, v.name);
      }
      case 'positions':
        return service.createPosition(input as z.infer<typeof bodySchemas.positions>);
      case 'headcounts':
        return service.setHeadcount(input as z.infer<typeof bodySchemas.headcounts>);
      case 'hodAssignments':
        return service.assignHod(input as z.infer<typeof bodySchemas.hodAssignments>);
      case 'approverAssignments':
        return service.assignApprover(input as z.infer<typeof bodySchemas.approverAssignments>);
      case 'delegations':
        return service.createDelegation(input as z.infer<typeof bodySchemas.delegations>);
      default:
        return service.createMasterData(
          masterKinds[type as keyof typeof masterKinds],
          input as z.infer<typeof bodySchemas.branches>,
        );
    }
  }),
  update: run(async (req, service) => {
    const type = parse(resource, req.params.resource);
    const recordId = parse(id, req.params.id);
    if (type === 'headcounts')
      return service.updateHeadcount(
        recordId,
        parse(
          z.strictObject({ approvedCount: z.number().int().nonnegative().optional(), effectiveTo: date.nullable().optional() }),
          req.body,
        ),
      );
    if (type === 'categories')
      return service.updateCategory(
        recordId,
        parse(
          z.strictObject({ name: name.optional(), active: z.boolean().optional(), settings: object.nullable().optional() }),
          req.body,
        ) as { name?: string; active?: boolean; settings?: Record<string, unknown> },
      );
    return service.update(
      type,
      recordId,
      parse(z.strictObject({ name: name.optional(), active: z.boolean().optional() }), req.body),
    );
  }),
  revoke: run(async (req, service) => {
    const recordId = parse(id, req.params.id);
    if (req.params.resource === 'approverAssignments') return service.revokeApprover(recordId);
    if (req.params.resource === 'delegations') return service.revokeDelegation(recordId);
    if (req.params.resource === 'hodAssignments') return service.deactivateHod(recordId);
    throw ApiError.badRequest('Revocation not supported');
  }),
  versions: run(async (req, service) => service.listVersions(parse(id, req.params.workflowId))),
  version: run(async (req, service) => {
    const v = parse(workflowIds, req.params);
    return service.getVersion(v.workflowId, v.versionId);
  }),
  createVersion: run(async (req, service) => {
    const workflowId = parse(id, req.params.workflowId);
    const v = parse(z.strictObject({ stages: z.array(stage).min(5), settings: object }), req.body);
    return service.createVersion(workflowId, v.stages, v.settings);
  }),
  activateVersion: run(async (req, service) => {
    const v = parse(workflowIds, req.params);
    return service.activateVersion(v.workflowId, v.versionId);
  }),
  retireVersion: run(async (req, service) => {
    const v = parse(workflowIds, req.params);
    return service.retireVersion(v.workflowId, v.versionId);
  }),
  validateHeadcount: run(async (req, service) => {
    const query = parse(z.strictObject({ departmentId: id, on: date }), req.query);
    return service.validateHeadcount(parse(id, req.params.id), query.departmentId, query.on);
  }),
};

router.get('/positions/:id/headcount-validation', configurationHandlers.validateHeadcount);
router.get('/workflows/:workflowId/versions', configurationHandlers.versions);
router.post('/workflows/:workflowId/versions', configurationHandlers.createVersion);
router.get('/workflows/:workflowId/versions/:versionId', configurationHandlers.version);
router.post('/workflows/:workflowId/versions/:versionId/activate', configurationHandlers.activateVersion);
router.post('/workflows/:workflowId/versions/:versionId/retire', configurationHandlers.retireVersion);
router.get('/:resource', configurationHandlers.list);
router.post('/:resource', configurationHandlers.create);
router.get('/:resource/:id', configurationHandlers.get);
router.patch('/:resource/:id', configurationHandlers.update);
router.post('/:resource/:id/revoke', configurationHandlers.revoke);
export { router as staffMovementConfigurationRoutes };
