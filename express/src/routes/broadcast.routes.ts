import { Router } from "express";
import { create, deleteBC, getByAccount, send } from "../controllers/broadcasts.controller";
import { authenticateToken } from "../middleware/authMiddleware";
import { verifyCSRF } from "../middleware/csrfMiddleware";
import { uploadMiddleware } from "../middleware/uploadMiddleware";

const router = Router();

router.post('/', authenticateToken, verifyCSRF, uploadMiddleware, create);
router.get('/:id', authenticateToken, getByAccount);
router.delete('/:id', authenticateToken, deleteBC);
router.post('/send/:id', authenticateToken, verifyCSRF, send);

export default router;