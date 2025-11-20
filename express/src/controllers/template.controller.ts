import { RequestHandler } from "express";
import { ErrorLogger } from "../utils/errorLogger";
import { prisma } from "../lib/prisma";
import { whatsappMarketingService } from "../services/whatsappCloudAPI";

export const getTemplates: RequestHandler = async (req, res) => {
    try {
        const { accountId } = req.params;

        if (!accountId) throw new Error('Faltam campos obrigatórios');

        const account = await prisma.account.findUnique({ where: { id: accountId } });

        if (!account) throw new Error('Conta não encontrada');

        const wabaId = account.wabaId || account.phoneId;

        const templates = await whatsappMarketingService.getMessageTemplates(wabaId, account.apiKey);
        //const approvedTemplates = templates.filter((t) => t.status === 'APPROVED');


        res.status(200).json({ message: '', ok: true, payload: templates });
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

