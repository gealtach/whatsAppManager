import { Router } from "express";
import { create, getAll } from "../controllers/account.controller";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get('/', authenticateToken, getAll);
router.post('/', authenticateToken, create);

export default router;