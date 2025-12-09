import { Router } from 'express';
import * as boxController from '../controllers/boxController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Apply authentication middleware to all box routes
router.use(authenticateJWT);

router.get('/', boxController.listBoxEntries);
router.post('/', boxController.createBoxEntry);
router.delete('/', boxController.clearBoxEntries);

router.get('/:id', boxController.getBoxEntry);
router.put('/:id', boxController.updateBoxEntry);
router.delete('/:id', boxController.deleteBoxEntry);

export default router;
