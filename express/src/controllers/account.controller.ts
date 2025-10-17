import { RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { ErrorLogger } from "../utils/errorLogger";

export const getAll: RequestHandler = async (req, res) => {
    try {
        if (req.user?.role === 1) {
            const acconunts = await prisma.account.findMany({
                include: {
                    clients: true,
                    broadcasts: true,
                }
            });
            res.status(200).json({ message: '', ok: true, payload: acconunts });
            return;
        }

        const acconunts = await prisma.accountUser.findMany({
            where: { userId: req.user?.userId },
            include: {
                account: {
                    include: {
                        clients: true,
                        broadcasts: true,
                    }
                }
            }
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

export const create: RequestHandler = async (req, res) => {
    try {
        const { name, phone, apiKey, authorized } = req.body;
        console.log(req.body)
        if (!name || !phone || !apiKey || !authorized) throw new Error('Faltam campos obrigatórios');
        if (!Array.isArray(authorized)
            || authorized.length < 1
            || !authorized.every(item => typeof item === 'string')) {
            throw new Error('Dados não compatíveis');
        };

        const phoneExists = await prisma.account.findUnique({ where: { phone } });
        if (phoneExists) throw new Error('Telemóvel já registado');

        const apikeyExist = await prisma.account.findFirst({ where: { apiKey } });
        if (apikeyExist) throw new Error('ApiKey já registada');

        await prisma.account.create({
            data: {
                name, phone, apiKey,
                accountUsers: {
                    create: authorized.map((userId: string) => ({
                        userId
                    }))
                }
            }
        });

        res.status(201).json({ message: 'Cuenta criada com sucesso', ok: true });
        return;
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Utilizador não encontrado': { status: 404, message: 'Utilizador não encontrado' },
                'Faltam campos obrigatórios': { status: 400, message: 'Faltam campos obrigatórios' },
                'Dados não compatíveis': { status: 400, message: 'Dados não compatíveis' },
                'Telemóvel já registado': { status: 400, message: 'Telemóvel já registado' },
                'ApiKey já registada': { status: 400, message: 'ApiKey já registada' },


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