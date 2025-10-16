import { Router } from "express";
import { getAll } from "../controllers/account.controller";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get('/', authenticateToken, getAll);

export default router;