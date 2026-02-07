import { Router } from 'express';
import { listPayouts, createPayout, retrievePayout, getPayoutInsights } from '../controllers/payout.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/payouts
 * @summary List all payouts
 * @tags Payouts
 * @security BearerAuth
 * @param {integer} accountId.query.required - Stripe account ID
 * @param {integer} page.query - Page number for pagination
 * @param {integer} pageSize.query - Number of items per page
 * @param {string} query.query - Search term for filtering
 * @param {string} sort.query - Sort field and direction
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} status.query - Payout status filter (paid, pending, in_transit, canceled, failed)
 * @param {string} currency.query - Currency filter
 * @param {string} type.query - Payout type filter (bank_account, card)
 * @param {string} method.query - Payout method filter (standard, instant)
 * @param {boolean} automatic.query - Filter by automatic payouts (true/false)
 * @param {integer} year.query - Filter payouts by creation year
 * @return {object} 200 - List of payouts with pagination
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 */
router.get('/', listPayouts);

/**
 * POST /api/v1/payouts
 * @summary Create a new payout
 * @tags Payouts
 * @security BearerAuth
 */
router.post('/', createPayout);


/**
 * GET /api/v1/payouts/insights/{accountId}
 * @summary Get payout insights
 * @tags Payouts
 * @security BearerAuth
 */
router.get('/insights/:accountId', getPayoutInsights);

/**
 * GET /api/v1/payouts/{payoutId}
 * @summary Retrieve a payout
 * @tags Payouts
 * @security BearerAuth
 */
router.get('/:payoutId', retrievePayout);

export default router;