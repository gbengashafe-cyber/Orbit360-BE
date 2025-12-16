import { Router } from 'express';
import { PositionController } from '../controllers/position.controller';

const router = Router();

router.get('/', PositionController.getAll);
router.get('/:id', PositionController.getById);
router.post('/', PositionController.create);
router.put('/:id', PositionController.update);
router.delete('/:id', PositionController.delete);

export default router;
