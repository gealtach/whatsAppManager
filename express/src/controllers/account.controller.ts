import { RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { ErrorLogger } from "../utils/errorLogger";

export const getAll: RequestHandler = async (req, res) => {
    try {
        if (req.user?.role === 1) {
            const acconunts = await prisma.account.findMany();
            res.status(200).json({ message: '', ok: true, payload: acconunts });
            return;
        }

        const acconunts = await prisma.accountUser.findMany({
            where: { userId: req.user?.userId },
            include: { account: true }
        })
        res.status(200).json({ message: '', ok: true, payload: acconunts });
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