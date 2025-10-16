import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { getClientIp } from './networkUtils';

const prisma = new PrismaClient();

export class LoginBlocker {
    // Verificar si está bloqueado
    static async isBlocked(email: string, ipAddress: string): Promise<{ blocked: boolean; reason?: string }> {
        const now = new Date();

        // Limpiar bloqueos expirados
        await prisma.loginBlock.deleteMany({
            where: { expiresAt: { lt: now } }
        });

        // Verificar bloqueo por email
        const emailBlock = await prisma.loginBlock.findFirst({
            where: {
                email,
                expiresAt: { gt: now }
            }
        });

        if (emailBlock) {
            return {
                blocked: true,
                reason: `Demasiados intentos fallidos para ${email}. Bloqueado hasta ${emailBlock.expiresAt.toLocaleTimeString()}`
            };
        }

        // Verificar bloqueo por IP
        const ipBlock = await prisma.loginBlock.findFirst({
            where: {
                ipAddress,
                expiresAt: { gt: now }
            }
        });

        if (ipBlock) {
            return {
                blocked: true,
                reason: `Demasiados intentos fallidos desde esta IP. Bloqueado hasta ${ipBlock.expiresAt.toLocaleTimeString()}`
            };
        }

        return { blocked: false };
    }

    // Contar intentos fallidos recientes
    static async getFailedAttempts(email: string, ipAddress: string): Promise<{ byEmail: number; byIp: number }> {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const [byEmail, byIp] = await Promise.all([
            // Intentos por email
            prisma.authLog.count({
                where: {
                    email,
                    action: 'LOGIN_FAILED',
                    timestamp: { gte: fiveMinutesAgo }
                }
            }),

            // Intentos por IP
            prisma.authLog.count({
                where: {
                    ipAddress,
                    action: 'LOGIN_FAILED',
                    timestamp: { gte: fiveMinutesAgo }
                }
            })
        ]);

        return { byEmail, byIp };
    }

    // Crear un bloqueo
    static async blockLogin(email: string, ipAddress: string, reason: string): Promise<void> {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

        await prisma.loginBlock.create({
            data: {
                email,
                ipAddress,
                reason,
                expiresAt
            }
        });

        // Log con metadata
        await prisma.authLog.create({
            data: {
                email,
                action: 'BLOCKED_ATTEMPT',
                ipAddress,
                userAgent: 'N/A',
                metadata: { reason, expiresAt } // ✅ Usando metadata
            }
        });
    }

    // Verificar y aplicar bloqueos si es necesario
    static async checkAndBlock(email: string, ipAddress: string): Promise<void> {
        const { byEmail, byIp } = await this.getFailedAttempts(email, ipAddress);

        // Bloquear por email (5 intentos)
        if (byEmail >= 5) {
            await this.blockLogin(email, ipAddress, `TOO_MANY_ATTEMPTS_EMAIL: ${byEmail} intentos en 5 minutos`);
        }

        // Bloquear por IP (8 intentos - un poco más alto para IPs compartidas)
        if (byIp >= 8) {
            await this.blockLogin(email, ipAddress, `TOO_MANY_ATTEMPTS_IP: ${byIp} intentos en 5 minutos`);
        }
    }

    // Método para verificar desde un request
    static async isBlockedFromRequest(email: string, req: Request): Promise<{ blocked: boolean; reason?: string }> {
        const ipAddress = getClientIp(req);
        return this.isBlocked(email, ipAddress);
    }
}