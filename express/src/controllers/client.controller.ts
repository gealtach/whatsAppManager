import { RequestHandler } from "express";
import { ErrorLogger } from "../utils/errorLogger";
import { prisma } from "../lib/prisma";

export const getByAccount: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error('Faltam campos obrigatórios');

        const clients = await prisma.client.findMany({
            where: { accountId: id },
            orderBy: { name: 'desc' }
        });

        res.status(200).json({ message: '', ok: true, payload: clients });
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

export const create: RequestHandler = async (req, res) => {
    try {
        const { name, phone, email, notes, accountId } = req.body;
        if (!name || !phone || !accountId) throw new Error('Faltam campos obligatórios');

        await prisma.client.create({
            data: { name, phone, email, notes, accountId }
        });

        res.status(201).json({ message: 'Cliente criado com sucesso', ok: true });
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

export const update: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, notes } = req.body;
        if (!id || !name || !phone) throw new Error('Faltam campos obrigatórios');

        const client = await prisma.client.findUnique({ where: { id } });
        if (!client) throw new Error('Cliente não encontrado')

        await prisma.client.update({
            where: { id },
            data: { name, phone, email, notes }
        });

        res.status(200).json({ message: 'Cliente atualizado com sucesso', ok: true });
        return;
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Cliente não encontrado': { status: 404, message: 'Cliente não encontrado' },
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

export const deleteClient: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error('Faltam campos obrigatórios');
        const client = await prisma.client.findUnique({ where: { id } });
        if (!client) throw new Error('Cliente não encontrado');
        await prisma.client.delete({ where: { id } });
        res.status(200).json({ message: 'Cliente apagado com sucesso', ok: true });
        return;
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Cliente não encontrado': { status: 404, message: 'Cliente não encontrado' },
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