import { Router } from 'express';
import { healthCheck, readinessCheck } from '../controllers/health.controller';

const router = Router();

/**
 * GET /health
 * @summary Health check endpoint
 * @description Returns the health status of the API
 * @tags Health
 * @return {object} 200 - Health status
 */
router.get('/health', healthCheck);

/**
 * GET /ready
 * @summary Readiness check endpoint
 * @description Returns readiness status for load balancers
 * @tags Health
 * @return {object} 200 - Readiness status
 */
router.get('/ready', readinessCheck);

export default router;