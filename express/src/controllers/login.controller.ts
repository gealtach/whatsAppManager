import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { logAuthAction } from '../utils/authLogger';
import { LoginBlocker } from '../utils/loginBlocker';
import { getClientIp } from '../utils/networkUtils';
import { ErrorLogger } from '../utils/errorLogger';

export const login: RequestHandler = async (req, res) => {
    const ipAddress = getClientIp(req);

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            await logAuthAction('LOGIN_FAILED', email, undefined, req);
            throw new Error('Faltam campos obrigatórios');
        }

        // ✅ Verificar si está bloqueado
        const blockCheck = await LoginBlocker.isBlocked(email, ipAddress);
        if (blockCheck.blocked) {
            await logAuthAction('BLOCKED_ATTEMPT', email, undefined, req);
            res.status(429).json({
                message: blockCheck.reason || 'Demasiados intentos fallidos. Intenta nuevamente en 5 minutos.',
                ok: false,
                blocked: true
            });
            return;
        }

        // Consultar al core para autenticación
        const response = await fetch(`${process.env.CORE_URL}/login/loginExternal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.CORE_KEY!
            },
            body: JSON.stringify({
                email,
                password,
                where: process.env.WHERE
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            await logAuthAction('LOGIN_FAILED', email, undefined, req);
            throw new Error(errorData.message || 'Erro de autenticação');
        }

        const coreResponse = await response.json();

        const userData = {
            role: coreResponse.user.role,
        };

        const token = jwt.sign(
            {
                userId: coreResponse.user.userId,
                email: coreResponse.user.email,
                role: coreResponse.user.role
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        // Generar CSRF token
        const csrfToken = randomBytes(32).toString('hex');

        // Establecer cookies
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        res.cookie('csrf_token', csrfToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, // 1H
            path: '/'
        });

        // ✅ Login exitoso
        await logAuthAction('LOGIN_SUCCESS', email, coreResponse.user.userId, req);

        res.status(200).json({
            message: 'Logado com sucesso',
            ok: true,
            user: userData,
            csrfToken
        });
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            await ErrorLogger.logAuthError(error, req.body?.email, req);
            const errorMap: { [key: string]: { status: number; message: string } } = {
                'Não autorizado': { status: 401, message: 'Não autorizado' },
                'Utilizador não encontrado': { status: 404, message: 'Utilizador não encontrado' },
                'Faltam campos obrigatórios': { status: 400, message: 'Faltam campos obrigatórios' },
                'Palavra-passe incorreta': { status: 400, message: 'Palavra-passe incorreta' },
                'Erro de autenticação': { status: 401, message: 'Erro de autenticação' },
                'Incorrect password': { status: 401, message: 'Erro de credenciais' },
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

export const logout: RequestHandler = async (req, res) => {
    try {
        // Obtener user data del token antes de limpiar
        const token = req.cookies.auth_token;
        if (token) {
            const decoded = jwt.decode(token) as { userId: string, email: string; role: number };
            // ✅ Log del logout
            await logAuthAction('LOGOUT', decoded?.email, decoded?.userId, req);
        }
    } catch (error) {
        console.error('Error logging logout:', error);
    }

    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
    });

    res.clearCookie('csrf_token', {
        secure: true,
        sameSite: 'strict',
        path: '/'
    });

    res.status(200).json({ message: 'Logout realizado com sucesso' });
};

// Opcional: Endpoint para ver estado de bloqueo
export const getLoginStatus: RequestHandler = async (req, res) => {
    const { email } = req.query;
    const ipAddress = getClientIp(req);

    if (!email || typeof email !== 'string') {
        res.status(400).json({ message: 'Email é obrigatório' });
        return;
    }

    try {
        const blockCheck = await LoginBlocker.isBlocked(email, ipAddress);
        const attempts = await LoginBlocker.getFailedAttempts(email, ipAddress);

        res.json({
            email,
            ipAddress,
            blocked: blockCheck.blocked,
            blockReason: blockCheck.reason,
            attemptsLast5Min: attempts,
            limits: {
                maxPerEmail: 5,
                maxPerIp: 8,
                blockMinutes: 5
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao verificar status' });
    }
};