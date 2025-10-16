import { PrismaClient } from '@prisma/client';
import { LoginBlocker } from './loginBlocker';
import { Request } from 'express';
import { getClientIp, getUserAgent } from './networkUtils';

const prisma = new PrismaClient();

export async function logAuthAction(
    action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'BLOCKED_ATTEMPT',
    email?: string,
    userId?: string,
    req?: Request
) {
    try {
        const ipAddress = getClientIp(req);
        const userAgent = getUserAgent(req);

        await prisma.authLog.create({
            data: {
                userId,
                email,
                action,
                ipAddress,
                userAgent,
            },
        });

        // Si es un login fallido, verificar si debemos bloquear
        if (action === 'LOGIN_FAILED' && email) {
            await LoginBlocker.checkAndBlock(email, ipAddress);
        }
    } catch (error) {
        console.error('Error logging auth action:', error);
    }
}