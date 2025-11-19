import { ErrorLogger } from "../utils/errorLogger";
import { prisma } from "../lib/prisma";
import { RequestHandler } from 'express';
import { whatsappMarketingService } from "../services/whatsappCloudAPI";

export const create: RequestHandler = async (req, res) => {
    try {
        const {
            accountId,
            name,
            message,
            clientIds,
            scheduledAt,
            templateName,
            templateLanguage = 'en_US',
            templateParams
        } = req.body;


        // Validaciones
        if (!name || !message || !accountId || !clientIds) {
            throw new Error('Faltam campos obrigatórios');
        }

        if (!Array.isArray(clientIds) ||
            clientIds.length < 1 ||
            !clientIds.every(item => typeof item === 'string')) {
            throw new Error('Dados não compatíveis');
        }

        if (!templateName) {
            throw new Error('O nome do modelo é obrigatório para a API de marketing do WhatsApp')
        }

        const account = await prisma.account.findUnique({
            where: { id: accountId },
        });

        if (!account?.isActive) throw new Error('Conta inválida ou inativa');

        const clients = await prisma.client.findMany({
            where: {
                id: { in: clientIds },
                accountId: accountId,
                isActive: true,
            },
        });

        if (clients.length === 0) throw new Error('Não foram encontrados clientes válidos');

        const broadcast = await prisma.broadcast.create({
            data: {
                name,
                message,
                templateName,
                templateLanguage,
                templateParams: templateParams || null,
                accountId,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                totalRecipients: clients.length,
                recipients: {
                    create: clients.map((client) => ({
                        clientId: client.id,
                        status: 'PENDING',
                    })),
                },
            },
            include: {
                recipients: {
                    include: {
                        client: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            broadcast,
        });


    } catch (error) {
        console.error('Erro ao criar broadcast:', error);

        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);

            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Utilizador não encontrado': { status: 404, message: 'Utilizador não encontrado' },
                'Faltam campos obrigatórios': { status: 400, message: 'Faltam campos obrigatórios' },
                'Dados não compatíveis': { status: 400, message: 'Dados não compatíveis' },
                'Conta inválida ou inativa': { status: 400, message: 'Conta inválida ou inativa' },
                'Não foram encontrados clientes válidos': { status: 400, message: 'Não foram encontrados clientes válidos' },
                'clientIds deve ser um array JSON válido': { status: 400, message: 'Dados de clientes inválidos' },
                'Tipo de arquivo não permitido': { status: 400, message: 'Tipo de arquivo não permitido' },
                'O nome do modelo é obrigatório para a API de marketing do WhatsApp': { status: 400, message: 'O nome do modelo é obrigatório para a API de marketing do WhatsApp' },
                'Erro ao processar arquivo': { status: 500, message: 'Erro ao processar arquivo' },
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

export const deleteBC: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error('Faltam campos obrigatórios');

        const broadcast = await prisma.broadcast.findUnique({ where: { id, status: 'PENDING' } });

        if (!broadcast) throw new Error('Difussão não encontrada');

        await prisma.broadcast.delete({ where: { id } });

        res.status(200).json({ message: 'Difussão eliminada com sucesso', ok: true });
        return;
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Difussão não encontrado': { status: 404, message: 'Difussão não encontrado' },
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

export const send: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error('Faltam campos obrigatórios');

        const broadcast = await prisma.broadcast.findUnique({
            where: { id },
            include: {
                account: true,
                recipients: {
                    where: {
                        status: 'PENDING',
                    },
                    include: {
                        client: true,
                    },
                },
            },
        });

        if (!broadcast) throw new Error('Difussão não encontrada');

        if (broadcast.recipients.length === 0) throw new Error('Não há destinatários pendentes para enviar');


        await prisma.broadcast.update({
            where: { id },
            data: {
                status: 'SENDING',
                sentAt: new Date(),
            },
        });

        const recipients = broadcast.recipients.map(r => ({
            id: r.id,
            phone: r.client.phone,
            name: r.client.name,
        }));

        const templateParams = broadcast.templateParams
            ? (typeof broadcast.templateParams === 'string'
                ? JSON.parse(broadcast.templateParams)
                : broadcast.templateParams)
            : null;

        const template = whatsappMarketingService.buildTemplate(
            broadcast.templateName,
            broadcast.templateLanguage,
            templateParams?.body // ['Nombre', 'Otro param']
        );

        res.status(202).json({
            success: true,
            message: 'Broadcast sending started',
            id,
            totalRecipients: recipients.length,
        });

        (async () => {
            const results = await whatsappMarketingService.sendBulkMessages(
                broadcast.account.phoneId,
                broadcast.account.apiKey,
                recipients,
                template,
                async (sent, total, recipientId, success) => {
                    // Actualizar estado de cada destinatario
                    await prisma.broadcastRecipient.update({
                        where: { id: recipientId },
                        data: {
                            status: success ? 'SENT' : 'FAILED',
                            sentAt: success ? new Date() : null,
                            errorMessage: success ? null : 'Failed to send message',
                        },
                    });

                    // Actualizar contadores
                    await prisma.broadcast.update({
                        where: { id },
                        data: {
                            sentCount: success
                                ? { increment: 1 }
                                : undefined,
                            failedCount: success
                                ? undefined
                                : { increment: 1 },
                        },
                    });

                    console.log(`Progress: ${sent}/${total} - Recipient ${recipientId}: ${success ? 'Success' : 'Failed'}`);
                },
                1000 // 1 segundo entre mensajes
            );

            // Actualizar estado final
            const successCount = results.filter(r => r.success).length;
            const failedCount = results.filter(r => !r.success).length;

            await prisma.broadcast.update({
                where: { id },
                data: {
                    status: failedCount === 0 ? 'COMPLETED' : (successCount > 0 ? 'COMPLETED' : 'FAILED'),
                    sentAt: new Date(),
                    sentCount: successCount,
                    failedCount: failedCount,
                },
            });

            console.log(`✅ Broadcast ${id} completed: ${successCount} sent, ${failedCount} failed`);
        })();
    } catch (error) {
        console.error(error);

        try {
            const { id: broadcastId } = req.params;
            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: { status: 'FAILED' },
            });
        } catch (updateError) {
            console.error('Error updating broadcast status:', updateError);
        }

        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Difussão não encontrado': { status: 404, message: 'Difussão não encontrado' },
                'Não há destinatários pendentes para enviar': { status: 404, message: 'Não há destinatários pendentes para enviar' },
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