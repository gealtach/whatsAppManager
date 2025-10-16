import { RequestHandler } from 'express';

// Extender la interfaz Request para incluir user con tipo específico
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            userId: string;
            email: string;
            role: number;
        };
    }
}

// Middleware solo para ADMIN (role 1) - USA SOLO EL TOKEN
export const requireAdmin: RequestHandler = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Não autorizado' });
            return;
        }

        // ✅ VERIFICAR DIRECTAMENTE DEL TOKEN - SIN CONSULTA AL CORE
        if (req.user.role !== 1) {
            res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
            return;
        }

        next();
    } catch (error) {
        console.error('Error in requireAdmin:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};