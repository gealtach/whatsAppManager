import { Router } from "express"
import { create, deleteClient, getByAccount, update } from "../controllers/client.controller";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get('/:id', authenticateToken, getByAccount);
router.post('/', authenticateToken, create);
router.put('/:id', authenticateToken, update);
router.delete('/:id', authenticateToken, deleteClient);

export default router;