// src/middleware/errorHandler.ts
import { Request, Response } from 'express';
import { ErrorLogger } from '../utils/errorLogger';

// Interface que coincide con tu JWT payload real
interface AuthenticatedUser {
    userId: string;
    email: string;
    role: number;
}

// Extender el Request para incluir user
interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
): void => {
    // Usar type assertion para acceder a user si existe
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.userId;

    // Loggear el error
    ErrorLogger.logApiError(err, req, userId, 500);

    // Respuesta al cliente
    res.status(500).json({
        message: 'Erro interno do servidor',
        ok: false,
        // En desarrollo, incluir más detalles
        ...(process.env.NODE_ENV !== 'production' && {
            debug: {
                error: err.message,
                stack: err.stack
            }
        })
    });
};
