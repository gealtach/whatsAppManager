import { Router } from 'express';
import { user } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, user);

export default router;