import { Router } from 'express';
import loginRoutes from './login.routes';
import userRoutes from './user.routes';
import csrfRoutes from './csrf.routes';
import accountRoutes from './account.routes';
import clientRoutes from './client.routes';
import broadcastRoutes from './broadcast.routes';

const router = Router();

router.use('/login', loginRoutes);
router.use('/user', userRoutes);
router.use('/csrf-token', csrfRoutes);

router.use('/account', accountRoutes);
router.use('/client', clientRoutes);
router.use('/broadcast', broadcastRoutes);

export default router;