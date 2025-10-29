import { ErrorLogger } from "../utils/errorLogger";
import { prisma } from "../lib/prisma";
import { RequestHandler } from 'express';
import { moveFileToFinalDestination } from "../middleware/uploadMiddleware";
import fs from 'node:fs/promises';

export const create: RequestHandler = async (req, res) => {
    try {
        const { name, message, accountId, scheduledAt } = req.body;

        const clientIds = JSON.parse(req.body.clientIds);

        // Validaciones
        if (!name || !message || !accountId || !clientIds) {
            throw new Error('Faltam campos obrigatórios');
        }
        if (!Array.isArray(clientIds) ||
            clientIds.length < 1 ||
            !clientIds.every(item => typeof item === 'string')) {
            throw new Error('Dados não compatíveis');
        }

        let complement = '';

        // Procesar archivo si existe
        if (req.file) {
            try {
                complement = await moveFileToFinalDestination(
                    req.file.path,
                    accountId,
                    req.file.filename
                );
            } catch (fileError) {
                console.error('Erro ao mover arquivo:', fileError);
                // Tentar eliminar archivo temporal
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Erro ao eliminar arquivo temporal:', unlinkError);
                }
                throw new Error('Erro ao processar arquivo');
            }
        }
        const date = scheduledAt ? new Date(scheduledAt) : null;
        // Crear broadcast en la base de datos
        const broadcast = await prisma.broadcast.create({
            data: {
                name,
                message,
                accountId,
                scheduledAt: date,
                complement: `${process.env.SERVER}${complement}`,
                recipients: {
                    create: clientIds.map(clientId => ({
                        clientId: clientId
                    }))
                }
            },
            include: {
                recipients: {
                    include: {
                        client: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Difusão criada com sucesso',
            ok: true,
            data: broadcast
        });
        return;

    } catch (error) {
        console.error('Erro ao criar broadcast:', error);

        // Limpiar archivo si existe y hubo error
        if (req.file?.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Erro ao eliminar arquivo após erro:', unlinkError);
            }
        }

        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);

            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Utilizador não encontrado': { status: 404, message: 'Utilizador não encontrado' },
                'Faltam campos obrigatórios': { status: 400, message: 'Faltam campos obrigatórios' },
                'Dados não compatíveis': { status: 400, message: 'Dados não compatíveis' },
                'clientIds deve ser um array JSON válido': { status: 400, message: 'Dados de clientes inválidos' },
                'Tipo de arquivo não permitido': { status: 400, message: 'Tipo de arquivo não permitido' },
                'Erro ao processar arquivo': { status: 500, message: 'Erro ao processar arquivo' }
            };

            const errorResponse = errorMap[error.message] || {
                status: 500,
                message: 'Erro interno do servidor'
            };

            res.status(errorResponse.status).json({
                message: errorResponse.message,
                ok: false
            });
        } else {
            await ErrorLogger.logAuthError(new Error('Unknown error'), req.body?.email, req);
            res.status(500).json({
                message: 'Erro interno do servidor',
                ok: false
            });
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