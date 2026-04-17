import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { query } from './database';
import { verifyToken, requireRole } from './middleware/auth';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import reportsRouter from './routes/reports';
import incidentsRouter from './routes/incidents';
import notificationsRouter from './routes/notifications';
import roundsRouter from './routes/rounds';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '12mb';

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'https://sj-security-v2.vercel.app',
];

const allowedOrigins = configuredOrigins.length > 0
  ? [...new Set([...configuredOrigins, ...defaultAllowedOrigins])]
  : defaultAllowedOrigins;

function isAllowedOrigin(origin: string) {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return /^https:\/\/sj-security-v2(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
}));
app.use(morgan(isProduction ? 'tiny' : 'combined', {
  skip: (req, res) => {
    if (req.method === 'OPTIONS') {
      return true;
    }

    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }

    if (isProduction && res.statusCode < 400) {
      return true;
    }

    return false;
  },
}));
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

const healthHandler = async (req: Request, res: Response) => {
  try {
    await query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
};

// Health check
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', verifyToken, usersRouter);
app.use('/api/reports', verifyToken, reportsRouter);
app.use('/api/incidents', verifyToken, incidentsRouter);
app.use('/api/notifications', verifyToken, notificationsRouter);
app.use('/api/rounds', verifyToken, roundsRouter);

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.too.large') {
    res.status(413).json({
      error: 'El reporte excede el tamaño permitido. Reduce el peso o la cantidad de fotos e intenta nuevamente.',
    });
    return;
  }

  if (!err) {
    next();
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database configured: ${Boolean(process.env.DATABASE_URL)}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});

export default app;
