import { Router } from "express";
import { Send } from "../controllers/whatsapp.controller";

const router = Router();

router.post('/send/:id', Send);

export default router;