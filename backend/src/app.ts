import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { foldersRouter } from './routes/folders.js';
import { filesRouter } from './routes/files.js';
import { projectsRouter } from './routes/projects.js';
import { analyticsRouter } from './routes/analytics.js';
import { importRouter } from './routes/import.js';
import { vaultRouter } from './routes/vault.js';
import { workflowsRouter } from './routes/workflows.js';
import { auditLogsRouter } from './routes/auditLogs.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): express.Application {
  const app = express();

  // CORS
  const origins = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) || ['http://localhost:3000'];
  app.use(cors({ origin: origins, credentials: true }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/folders', foldersRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/import', importRouter);
  app.use('/api/vault', vaultRouter);
  app.use('/api/workflows', workflowsRouter);
  app.use('/api/audit-logs', auditLogsRouter);

  // 404
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
