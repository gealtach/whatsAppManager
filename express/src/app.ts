import express, { Application } from 'express';
import routes from './routes';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

if (process.env.NODE_ENV === 'production') {
    // En cPanel/hosting compartido, confía en el primer proxy
    app.set('trust proxy', 1);
    // Alternativa más específica si conoces la IP del proxy:
    // app.set('trust proxy', 'proxy-ip-address');
}

// Rate limiting - apply early to protect against abuse
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 200, // each IP can make up to 200 requests per windowMs (10 minutes)
    standardHeaders: true, // add the RateLimit-* headers to the response
    legacyHeaders: false, // remove the X-RateLimit-* headers from the response
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
        : 'http://localhost:3000', // Allow localhost in development
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'],
    credentials: true // Allow cookies/auth headers
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Add size limit for security
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting to all requests
app.use(limiter);


app.use('/', routes);
app.use(errorHandler);

export default app;