// middlewares/csrfMiddleware.ts
import { RequestHandler } from 'express';

export const verifyCSRF: RequestHandler = (req, res, next) => {
    // Excluir métodos GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const csrfTokenHeader = req.headers['x-csrf-token'] as string;
    const csrfTokenCookie = req.cookies.csrf_token;

    if (!csrfTokenHeader || !csrfTokenCookie) {
        res.status(403).json({ message: 'CSRF token missing' });
        return;
    }

    if (csrfTokenHeader !== csrfTokenCookie) {
        res.status(403).json({ message: 'Invalid CSRF token' });
        return;
    }

    next();
};