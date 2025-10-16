import { Router } from 'express';
import loginRoutes from './login.routes';
import userRoutes from './user.routes';
import csrfRoutes from './csrf.routes';
import accountRoutes from './account.routes';

const router = Router();

router.use('/login', loginRoutes);
router.use('/user', userRoutes);
router.use('/csrf-token', csrfRoutes);

router.use('/account', accountRoutes);

export default router;