import { Router } from "express";
import { create, deleteAccount, getAll, verify } from "../controllers/account.controller";
import { authenticateToken } from "../middleware/authMiddleware";
import { verifyCSRF } from "../middleware/csrfMiddleware";

const router = Router();

router.get('/', authenticateToken, getAll);
router.post('/', authenticateToken, verifyCSRF, create);
router.delete('/id', authenticateToken, verifyCSRF, deleteAccount);
router.get('/:id/verify', authenticateToken, verify);

export default router;