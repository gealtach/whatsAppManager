import { RequestHandler } from 'express';
import { CoreService } from '../services/coreService';
import { ErrorLogger } from '../utils/errorLogger';

const coreService = CoreService.getInstance();

export const user: RequestHandler = async (req, res) => {
    try {
        const userId = req.user!.userId;

        // Consultar directamente al core
        const user = await coreService.getUser(userId);

        if (!user) {
            res.status(404).json({ message: 'Utilizador não encontrado' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Utilizador não encontrado': { status: 404, message: 'Utilizador não encontrado' },
                'Faltam campos obrigatórios': { status: 400, message: 'Faltam campos obrigatórios' },
            };
            const errorResponse = errorMap[error.message] || { status: 500, message: 'Erro interno do servidor' };
            res.status(errorResponse.status).json({
                message: errorResponse.message,
                ok: false
            });
        } else {
            await ErrorLogger.logAuthError(new Error('Unknown error'), req.body?.email, req);
            res.status(500).json({ message: 'Erro interno do servidor', ok: false });
        }
    }
};

export const getAll: RequestHandler = async (req, res) => {
    try {
        const users = await coreService.getAllUsers();

        res.status(200).json({ message: '', ok: true, payload: users });
        return;
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Utilizador não encontrado': { status: 404, message: 'Utilizador não encontrado' },
                'Faltam campos obrigatórios': { status: 400, message: 'Faltam campos obrigatórios' },
            };
            const errorResponse = errorMap[error.message] || { status: 500, message: 'Erro interno do servidor' };
            res.status(errorResponse.status).json({
                message: errorResponse.message,
                ok: false
            });
        } else {
            await ErrorLogger.logAuthError(new Error('Unknown error'), req.body?.email, req);
            res.status(500).json({ message: 'Erro interno do servidor', ok: false });
        }
    }
};