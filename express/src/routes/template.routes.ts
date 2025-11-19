import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { getTemplates } from "../controllers/template.controller";

const router = Router();

router.get('/:accountId', authenticateToken, getTemplates);

export default router;