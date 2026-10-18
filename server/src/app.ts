import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): express.Application => {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploads
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads serving
  const uploadsPath = path.resolve(__dirname, '../', env.UPLOAD_DIR);
  app.use('/uploads', express.static(uploadsPath));

  // API Routes
  app.use('/api/v1', routes);

  // Root welcome
  app.get('/', (_req, res) => {
    res.json({
      message: `Welcome to ${env.APP_NAME} API Engine`,
      documentation: '/docs',
      health: '/api/v1/health',
      version: '1.0.0',
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
