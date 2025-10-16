import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

// Extender la interfaz Request
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            userId: string;
            email: string;
            role: number;
        };
    }
}

export const authenticateToken: RequestHandler = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        res.status(401).json({ message: 'Token de autenticação não fornecido' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            email: string;
            role: number;
        };

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Token inválido ou expirado' });
        return;
    }
};