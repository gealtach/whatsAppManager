// src/utils/errorLogger.ts
import { Request } from 'express';
import { getClientIp, getUserAgent } from './networkUtils';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';


export interface ErrorLogData {
    userId?: string;
    email?: string;
    error: Error;
    req?: Request;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    additionalInfo?: Record<string, unknown>;
}

export class ErrorLogger {
    static async logError(data: ErrorLogData): Promise<void> {
        try {
            // Sanitizar request body para no loggear passwords
            const sanitizedBody = data.req?.body ? this.sanitizeRequestBody(data.req.body) : undefined;

            // Sanitizar headers para no loggear tokens sensibles
            const sanitizedHeaders = data.req?.headers ? this.sanitizeHeaders(data.req.headers) : undefined;

            await prisma.errorLog.create({
                data: {
                    userId: data.userId,
                    email: data.email,
                    errorName: data.error.name || 'UnknownError',
                    errorMessage: data.error.message,
                    stackTrace: data.error.stack,
                    endpoint: data.endpoint || data.req?.originalUrl,
                    method: data.method || data.req?.method,
                    ipAddress: getClientIp(data.req),
                    userAgent: getUserAgent(data.req),
                    requestBody: sanitizedBody as Prisma.InputJsonValue,
                    headers: sanitizedHeaders as Prisma.InputJsonValue,
                    statusCode: data.statusCode,
                },
            });

            // También loggear en consola para desarrollo
            if (process.env.NODE_ENV !== 'production') {
                console.error('🔴 Error logged:', {
                    error: data.error.message,
                    endpoint: data.endpoint || data.req?.originalUrl,
                    userId: data.userId,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (loggingError) {
            // Fallback: si falla el logging, al menos loggear en consola
            console.error('❌ Failed to log error to database:', loggingError);
            console.error('Original error:', data.error);
        }
    }

    private static sanitizeRequestBody(body: unknown): Prisma.InputJsonValue | undefined {
        if (!body || typeof body !== 'object') return undefined;

        const sanitized: Record<string, unknown> = { ...body as Record<string, unknown> };

        // Campos sensibles que no queremos loggear
        const sensitiveFields = [
            'password',
            'confirmPassword',
            'currentPassword',
            'newPassword',
            'token',
            'accessToken',
            'refreshToken',
            'authorization'
        ];

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '***REDACTED***';
            }
        };

        return sanitized as Prisma.InputJsonValue;
    }

    private static sanitizeHeaders(headers: unknown): Prisma.InputJsonValue | undefined {
        if (!headers || typeof headers !== 'object') return undefined;

        const sanitized: Record<string, unknown> = { ...headers as Record<string, unknown> };

        // Headers sensibles
        const sensitiveHeaders = [
            'authorization',
            'cookie',
            'x-api-key',
            'x-auth-token',
            'proxy-authorization'
        ];

        for (const header of sensitiveHeaders) {
            const lowerHeader = header.toLowerCase();
            for (const key of Object.keys(sanitized)) {
                if (key.toLowerCase() === lowerHeader) {
                    sanitized[key] = '***REDACTED***';
                }
            };
        };

        return sanitized as Prisma.InputJsonValue;
    }

    // Método para errores de autenticación
    static async logAuthError(error: Error, email?: string, req?: Request, statusCode?: number): Promise<void> {
        await this.logError({
            email,
            error,
            req,
            endpoint: '/api/auth/login',
            method: 'POST',
            statusCode,
            additionalInfo: { authFlow: true }
        });
    }

    // Método para errores de API genéricos
    static async logApiError(error: Error, req: Request, userId?: string, statusCode?: number): Promise<void> {
        await this.logError({
            userId,
            error,
            req,
            statusCode,
            additionalInfo: { apiFlow: true }
        });
    }
}