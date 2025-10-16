// routes/csrf.routes.ts
import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

router.get('/', (req, res) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Establecer cookie para CSRF
    res.cookie('csrf_token', csrfToken, {
        secure: true,
        sameSite: 'lax', // o 'strict'
        maxAge: 1 * 24 * 60 * 60 * 1000,
        path: '/'
    });

    res.json({ csrfToken });
});

export default router;