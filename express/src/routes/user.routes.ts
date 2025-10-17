import { Router } from 'express';
import { getAll, user } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, user);
router.get('/getAll', authenticateToken, getAll);

export default router;