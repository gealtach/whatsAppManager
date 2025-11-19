import { RequestHandler } from "express";
import { ErrorLogger } from "../utils/errorLogger";
import { prisma } from "../lib/prisma";


export const Send: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error('Faltam campos obrigatórios');

        const broadcast = await prisma.broadcast.findUnique({
            where: { id },
            include: {
                recipients: {
                    include: { client: true }
                },
                account: true
            }
        });
        if (!broadcast) throw new Error('Emissão não encontrada');

        await prisma.broadcast.update({
            where: { id },
            data: { status: 'SENDING' }
        });

        for (const recipient of broadcast.recipients) {
            try {
                
                console.log(recipient.client.name);
                await prisma.broadcastRecipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date()
                    }
                });
            } catch (error) {
                if (error instanceof Error) {
                    await prisma.broadcastRecipient.update({
                        where: { id: recipient.id },
                        data: {
                            status: 'FAILED',
                            errorMessage: error.message
                        }
                    });
                } else {
                    await prisma.broadcastRecipient.update({
                        where: { id: recipient.id },
                        data: {
                            status: 'FAILED',
                            errorMessage: 'Erro desconhecido'
                        }
                    });
                }
            }
        };

        await prisma.broadcast.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                sentAt: new Date()
            }
        });

        res.status(200).json({ message: 'Emissão enviada com sucesso', ok: true });
        return;
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Emissão não encontrada': { status: 404, message: 'Emissão não encontrada' },
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
