import { Router } from "express"
import { create, deleteClient, getByAccount, update } from "../controllers/client.controller";
import { authenticateToken } from "../middleware/authMiddleware";
import { verifyCSRF } from "../middleware/csrfMiddleware";

const router = Router();

router.get('/:id', authenticateToken, getByAccount);
router.post('/', authenticateToken, verifyCSRF, create);
router.put('/:id', authenticateToken, verifyCSRF, update);
router.delete('/:id', authenticateToken, deleteClient);

export default router;