import { RequestHandler } from "express";
import { ErrorLogger } from "../utils/errorLogger";
import { prisma } from "../lib/prisma";

export const create: RequestHandler = async (req, res) => {
    try {
        const { name, message, clientIds, accountId, scheduledAt, complement } = req.body;
        if (!name || !message || !accountId || !clientIds) throw new Error('Faltam campos obrigatórios');
        if (!Array.isArray(clientIds)
            || clientIds.length < 1
            || !clientIds.every(item => typeof item === 'string')) {
            throw new Error('Dados não compatíveis');
        };

        await prisma.broadcast.create({
            data: {
                name,
                message,
                accountId,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                recipients: {
                    create: clientIds.map(clientId => ({
                        clientId: clientId
                    }))
                },
                complement,
            },
            include: {
                recipients: {
                    include: {
                        client: true
                    }
                }
            }
        });

        res.status(201).json({ message: 'Criado com sucesso', ok: true });
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

export const getByAccount: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error('Faltam campos obrigatórios');

        const broadcasts = await prisma.broadcast.findMany({
            where: { accountId: id },
            include: {
                _count: {
                    select: {
                        recipients: true
                    }
                },
                recipients: {
                    include: {
                        client: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ message: '', ok: true, payload: broadcasts });
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