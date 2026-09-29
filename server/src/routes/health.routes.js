import { Router } from 'express';
import { isConnected } from '../config/db.js';

export const healthRouter = Router();

/**
 * GET /api/health
 * Simple health check verifying API uptime and database connection status.
 */
healthRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'In Progress API',
    timestamp: new Date().toISOString(),
    database: isConnected() ? 'connected' : 'disconnected',
  });
});
