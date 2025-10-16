import { Request } from 'express';

export function getClientIp(req?: Request): string {
    if (!req) return 'unknown';

    // Opción 1: Desde req.ip (si usas express trust proxy)
    if (req.ip) return req.ip;

    // Opción 2: Desde x-forwarded-for (puede ser string o array)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
        if (Array.isArray(xForwardedFor)) {
            return xForwardedFor[0]; // Primera IP del array
        }
        return xForwardedFor.split(',')[0].trim(); // Primera IP del string
    }

    // Opción 3: Desde socket (sin deprecation)
    if (req.socket?.remoteAddress) {
        return req.socket.remoteAddress;
    }

    return 'unknown';
}

export function getUserAgent(req?: Request): string {
    if (!req) return 'unknown';

    const userAgent = req.headers['user-agent'];
    return userAgent || 'unknown';
}