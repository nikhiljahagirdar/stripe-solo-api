import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/dashboard
 * @summary Get dashboard analytics
 * @tags Dashboard
 * @return {object} 200 - Success response
 * @return {object} 401 - Unauthorized
 */
router.get('/', getDashboardData);

export default router;
