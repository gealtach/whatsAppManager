import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';

interface ErrorLogsQuery {
    page?: string;
    limit?: string;
    errorName?: string;
    email?: string;
    startDate?: string;
    endDate?: string;
}

export const getErrorLogs: RequestHandler = async (req, res) => {
    try {
        const {
            page = '1',
            limit = '50',
            errorName,
            email,
            startDate,
            endDate
        } = req.query as ErrorLogsQuery;

        const where: Record<string, unknown> = {};

        if (errorName) {
            where.errorName = { contains: errorName };
        }
        if (email) {
            where.email = { contains: email };
        }

        if (startDate || endDate) {
            const timestampFilter: Record<string, Date> = {};
            if (startDate) timestampFilter.gte = new Date(startDate);
            if (endDate) timestampFilter.lte = new Date(endDate);
            where.timestamp = timestampFilter;
        }

        const logs = await prisma.errorLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            select: {
                id: true,
                errorName: true,
                errorMessage: true,
                endpoint: true,
                method: true,
                statusCode: true,
                email: true,
                userId: true,
                ipAddress: true,
                timestamp: true
            }
        });

        const total = await prisma.errorLog.count({ where });

        res.json({
            logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching error logs:', error);
        res.status(500).json({ message: 'Erro ao buscar logs de erro' });
    }
};

export const getErrorDetail: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;

        const errorLog = await prisma.errorLog.findUnique({
            where: { id }
        });

        if (!errorLog) {
            res.status(404).json({ message: 'Log de erro não encontrado' });
            return;
        }

        res.json(errorLog);
    } catch (error) {
        console.error('Error fetching error detail:', error);
        res.status(500).json({ message: 'Erro ao buscar detalhes do erro' });
    }
};