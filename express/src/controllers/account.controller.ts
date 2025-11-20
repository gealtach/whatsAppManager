import { RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { ErrorLogger } from "../utils/errorLogger";
import { whatsappMarketingService } from "../services/whatsappCloudAPI";

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
        });

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
        const {
            name,
            phone,
            phoneId,
            wabaId,
            apiKey,
            authorized
        } = req.body;

        if (!name || !phone || !apiKey || !phoneId || !authorized || !wabaId) throw new Error('Faltam campos obrigatórios');

        if (!Array.isArray(authorized)
            || authorized.length < 1
            || !authorized.every(item => typeof item === 'string')) {
            throw new Error('Dados não compatíveis');
        };

        const phoneExists = await prisma.account.findUnique({ where: { phone } });
        if (phoneExists) throw new Error('Telemóvel já registado');

        const phoneIdExists = await prisma.account.findUnique({ where: { phoneId } });
        if (phoneIdExists) throw new Error('Telemóvel ID já registado');

        const apikeyExist = await prisma.account.findFirst({ where: { apiKey } });
        if (apikeyExist) throw new Error('ApiKey já registada');

        try {
            const accountInfo = await whatsappMarketingService.verifyAccount(
                phoneId,
                apiKey
            );

            // Crear la cuenta
            await prisma.account.create({
                data: {
                    name,
                    phone,
                    phoneId,
                    wabaId: wabaId || null,
                    apiKey,
                    isActive: true,
                    verifiedName: accountInfo.verified_name,
                    qualityRating: accountInfo.quality_rating,
                    messagingTier: accountInfo.messaging_limit_tier,
                    lastVerifiedAt: new Date(),
                },
            });

        } catch (verifyError) {
            res.status(400).json({
                error: 'Invalid WhatsApp credentials',
                details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
            });
            return;
        };

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
                'Telemóvel ID já registado': { status: 400, message: 'Telemóvel ID já registado' },
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

export const verify: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error('Faltam campos obrigatórios');

        const account = await prisma.account.findUnique({
            where: { id },
        });

        if (!account) throw new Error('Conta não encontrada');

        const accountInfo = await whatsappMarketingService.verifyAccount(
            account.phoneId,
            account.apiKey
        );

        // Actualizar información
        const updatedAccount = await prisma.account.update({
            where: { id },
            data: {
                verifiedName: accountInfo.verified_name,
                qualityRating: accountInfo.quality_rating,
                messagingTier: accountInfo.messaging_limit_tier,
                lastVerifiedAt: new Date(),
            },
        });

        res.json({
            ok: true,
            account: {
                ...updatedAccount,
                apiKey: updatedAccount.apiKey.substring(0, 10) + '***',
            },
            info: accountInfo,
        });

    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Conta não encontrada': { status: 404, message: 'Conta não encontrada' },
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

export const deleteAccount: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error('Faltam campos obrigatórios');

        const account = await prisma.account.findUnique({
            where: { id },
        });

        if (!account) throw new Error('Conta não encontrada');

        await prisma.account.delete({
            where: { id },
        });

        res.status(200).json({ message: 'Conta eliminada com sucesso', ok: true });
        return;
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Conta não encontrada': { status: 404, message: 'Conta não encontrada' },
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