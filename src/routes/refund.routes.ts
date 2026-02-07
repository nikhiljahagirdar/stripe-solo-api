import { Router } from 'express';
import { listRefunds, createRefund } from '../controllers/refund.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/refunds
 * @summary List refunds with search and pagination
 * @tags Refunds
 * @security BearerAuth
 * @param {integer} page.query - Page number for pagination
 * @param {integer} pageSize.query - Number of items per page
 * @param {string} query.query - Search term for filtering by status, currency, or reason
 * @param {string} sort.query - Sort field and direction (e.g., amount:desc)
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} status.query - Refund status filter
 * @param {string} currency.query - Currency filter
 * @param {string} reason.query - Refund reason filter
 * @param {integer} [accountId] accountId.query - An account ID to filter refunds.
 * @param {integer} [year] year.query - A year to filter refunds by creation date.
 * @return {object} 200 - List of refunds with pagination
 * @return {object} 401 - Unauthorized
 */
router.get('/', listRefunds);

/**
 * POST /api/v1/refunds
 * @summary Create refund
 * @tags Refunds
 * @security BearerAuth
 */
router.post('/', createRefund);

export default router;