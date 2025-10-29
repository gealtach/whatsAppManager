import { Router } from "express";
import { create, getByAccount } from "../controllers/broadcasts.controller";
import { authenticateToken } from "../middleware/authMiddleware";
import { verifyCSRF } from "../middleware/csrfMiddleware";
import { uploadMiddleware } from "../middleware/uploadMiddleware";

const router = Router();

router.post('/', authenticateToken, verifyCSRF, uploadMiddleware, create);
router.get('/:id', authenticateToken, getByAccount);

export default router;