import { Router } from "express";
import { create, getByAccount } from "../controllers/broadcasts.controller";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.post('/',authenticateToken, create);
router.get('/:id',authenticateToken, getByAccount);

export default router;