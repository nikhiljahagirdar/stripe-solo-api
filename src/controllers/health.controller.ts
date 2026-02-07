import type { Request, Response } from 'express';
import { db } from '../db';

/**
 * Health check response object.
 * @typedef {object} HealthCheckResponse
 * @property {string} status - Health status (healthy or unhealthy)
 * @property {string} timestamp - ISO timestamp of the health check
 * @property {number} uptime - Application uptime in seconds
 * @property {string} version - Application version
 * @property {string} error - Error message (only present when unhealthy)
 */

/**
 * Readiness check response object.
 * @typedef {object} ReadinessCheckResponse
 * @property {string} status - Readiness status (ready)
 */

/**
 * GET /health
 * @summary Application health check
 * @description Performs a comprehensive health check including database connectivity. Returns the current status of the application and its dependencies.
 * @tags Health
 * @return {HealthCheckResponse} 200 - Application is healthy
 * @example response - 200 - Healthy response
 * {
 *   "status": "healthy",
 *   "timestamp": "2023-11-01T10:30:00.000Z",
 *   "uptime": 3600.5,
 *   "version": "1.0.0"
 * }
 * @return {HealthCheckResponse} 503 - Application is unhealthy
 * @example response - 503 - Unhealthy response
 * {
 *   "status": "unhealthy",
 *   "timestamp": "2023-11-01T10:30:00.000Z",
 *   "error": "Database connection failed"
 * }
 */
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check database connection
    await db.execute('SELECT 1');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
};

/**
 * GET /ready
 * @summary Application readiness check
 * @description Indicates whether the application is ready to serve traffic. This is typically used by orchestration systems like Kubernetes.
 * @tags Health
 * @return {ReadinessCheckResponse} 200 - Application is ready
 * @example response - 200 - Ready response
 * {
 *   "status": "ready"
 * }
 */
export const readinessCheck = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ status: 'ready' });
};
