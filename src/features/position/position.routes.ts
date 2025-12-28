import { Router } from 'express';
import { PositionController } from './position.controller';
import { validateCreatePosition, validateUpdatePosition } from './position.validators';

const router = Router();

router.get('/', PositionController.getAll);
router.get('/:id', PositionController.getById);
router.post('/', validateCreatePosition, PositionController.create);
router.put('/:id', validateUpdatePosition, PositionController.update);
router.delete('/:id', PositionController.delete);

export default router;
