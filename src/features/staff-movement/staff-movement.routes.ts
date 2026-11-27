import { Request, Router } from 'express';
import { validateAuthToken } from '../authentication/auth.middleware';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { createDraft, applyCommand, readRequest, listRequests } from './staff-movement.requests';
import { parse, id } from './staff-movement.intake';

export const movementRequests = Router();
movementRequests.use(validateAuthToken);
const actor = (req: Request) => {
  if (!req.user?.id) throw ApiError.unauthenticated('Authentication required');
  return req.user.id;
};
const requestId = (req: Request) => parse(id, Number(req.params.id));
movementRequests.get('/', async (req, res) => {
  res.json(ApiResponse({ data: await listRequests(actor(req), req.query) }));
});
movementRequests.post('/', async (req, res) => {
  res.status(201).json(ApiResponse({ data: await createDraft(actor(req), req.body) }));
});
movementRequests.get('/:id', async (req, res) => {
  res.json(ApiResponse({ data: await readRequest(actor(req), requestId(req)) }));
});
movementRequests.patch('/:id', async (req, res) => {
  res.json(ApiResponse({ data: await applyCommand(actor(req), requestId(req), { ...req.body, action: 'EDIT' }) }));
});
movementRequests.post('/:id/actions', async (req, res) => {
  res.json(ApiResponse({ data: await applyCommand(actor(req), requestId(req), req.body) }));
});
