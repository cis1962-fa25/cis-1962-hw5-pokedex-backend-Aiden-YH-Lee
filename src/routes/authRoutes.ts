import { Router } from 'express';
import { generateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/token', generateToken);

export default router;
