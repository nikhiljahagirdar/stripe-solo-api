import { Router } from 'express';
import { getFinancialSummary } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';


const router = Router();

/**
 * GET /analytics/summary
 * @summary Get financial summary
 * @tags Analytics
 * @return {object} 200 - Success response
 * @return {object} 401 - Unauthorized
 */
router.get('/summary', authenticate,  getFinancialSummary);

export default router;
