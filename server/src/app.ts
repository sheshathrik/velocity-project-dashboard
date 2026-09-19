import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  // Middleware configurations
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root Status & Health check
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'Velocity Project Dashboard Backend API',
      status: 'operational',
      environment: env.NODE_ENV,
      health: '/health',
      frontend: env.CLIENT_URL,
      version: '1.0.0',
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Structured Error Handler — no raw stack traces exposed to client
  app.use(errorHandler);

  return app;
}

