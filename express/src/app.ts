import express, { Application, NextFunction, Response, Request } from 'express';
import routes from './routes';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import path from 'node:path';

const app: Application = express();

app.use((req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy COMPLETO
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'none'; " +      // No hay JS en API responses
        "style-src 'none'; " +       // No hay CSS en API responses  
        "img-src 'none'; " +         // No hay imágenes en API responses
        "connect-src 'self'; " +     // Para preflight requests
        "frame-ancestors 'none'; " + //Anti-clickjacking
        "form-action 'none'; " +     // No hay formularios
        "base-uri 'self'; " +
        "object-src 'none'"
    );

    // Otros headers de seguridad
    res.setHeader('X-Frame-Options', 'DENY'); ////Anti-clickjacking
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    next();
});

if (process.env.NODE_ENV === 'production') {
    // En cPanel/hosting compartido, confía en el primer proxy
    app.set('trust proxy', 1);
}

// Rate limiting - apply early to protect against abuse
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 200, // each IP can make up to 200 requests per windowMs (10 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests, please try again later.'
    }
});

// CORS configuration - be more restrictive in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            'http://localhost:3000',
        ]
        : 'http://localhost:3000',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'],
    credentials: true
};

app.use(cors(corsOptions));

// IMPORTANTE: Servir archivos estáticos ANTES de parsear JSON
// Esto permite que los archivos en /uploads sean accesibles públicamente
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting to all requests
app.use(limiter);

app.use('/', routes);
app.use(errorHandler);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        statusCode: 404
    });
});

export default app;