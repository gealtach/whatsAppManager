import { Router } from "express";
import { create, getAll } from "../controllers/account.controller";
import { authenticateToken } from "../middleware/authMiddleware";
import { verifyCSRF } from "../middleware/csrfMiddleware";

const router = Router();

router.get('/', authenticateToken, getAll);
router.post('/', authenticateToken,verifyCSRF, create);

export default router;