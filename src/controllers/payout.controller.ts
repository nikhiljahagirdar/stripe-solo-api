import type { Request, Response, NextFunction } from 'express';
import { PayoutService } from '../services/payout.service';
import { getOrCreateStripeClient } from '../services/client.service';

const payoutService = new PayoutService();

import { getUserFromToken } from '../utils/auth.utils';

/**
 * Payout creation request object.
 * @typedef {object} CreatePayoutRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {number} amount.required - Amount to pay out in cents
 * @property {string} currency.required - Three-letter ISO currency code
 */

/**
 * Stripe payout object.
 * @typedef {object} StripePayout
 * @property {string} id - Unique identifier for the payout
 * @property {number} amount - Amount paid out in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} status - Status of the payout (paid, pending, in_transit, canceled, failed)
 * @property {string} type - Type of payout (bank_account, card)
 * @property {string} method - Payout method (standard, instant)
 * @property {number} arrival_date - Expected arrival date of the payout
 * @property {number} created - Time at which the payout was created
 * @property {string} description - Description of the payout
 * @property {object} destination - Destination for the payout
 * @property {boolean} automatic - Whether this is an automatic payout
 */

/**
 * GET /api/v1/payouts
 * @summary List all payouts for a Stripe account
 * @description Retrieves a list of payouts for the specified account with filtering, sorting, and pagination
 * @tags Payouts
 * @security BearerAuth
 * @param {integer} accountId.query.required - Stripe account ID
 * @param {integer} [page=1] page.query - Page number for pagination
 * @param {integer} [pageSize=20] pageSize.query - Number of items per page (max 100)
 * @param {string} [query] query.query - Search term for filtering by payout ID or description
 * @param {string} [sort=created:desc] sort.query - Sort field and direction (created, amount, arrival_date)
 * @param {string} [startDate] startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} [endDate] endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} [period] period.query - Predefined period (7d, 30d, 90d, 1y, custom)
 * @param {string} [status] status.query - Payout status filter (paid, pending, in_transit, canceled, failed)
 * @param {string} [currency] currency.query - Currency filter (usd, eur, gbp, etc.)
 * @param {string} [type] type.query - Payout type filter (bank_account, card)
 * @param {string} [method] method.query - Payout method filter (standard, instant)
 * @param {boolean} [automatic] automatic.query - Filter by automatic payouts (true/false)
 * @param {integer} [year] year.query - Filter payouts by creation year
 * @return {object} 200 - Paginated list of payouts
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "po_1234567890",
 *       "amount": "1000.00",
 *       "currency": "usd",
 *       "status": "paid",
 *       "type": "bank_account",
 *       "method": "standard",
 *       "arrival_date": 1635811200,
 *       "created": 1635724800,
 *       "description": "Weekly payout",
 *       "automatic": true
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "pageSize": 20,
 *     "total": 150,
 *     "totalPages": 8
 *   }
 * }
 * @return {object} 400 - Bad Request - Invalid parameters
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const listPayouts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const {
      accountId,
      page = '1',
      pageSize = '20',
      query,
      sort = 'created:desc',
      startDate,
      endDate,
      period,
      status,
      currency,
      type,
      method,
      automatic,
      year
    } = req.query;
    
    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required as a query parameter.' }); return;
    }

    const pageNum = Math.max(1, Number(page as string));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize as string)));

    const payouts = await payoutService.findAllWithFilters({
      userId: user.id,
      accountId: Number(accountId as string),
      page: pageNum,
      pageSize: pageSizeNum,
      query: query as string,
      sort: sort as string,
      startDate: startDate as string,
      endDate: endDate as string,
      period: period as string,
      status: status as string,
      currency: currency as string,
      type: type as string,
      method: method as string,
      automatic: automatic ? automatic === 'true' : undefined,
      year: year ? Number(year as string) : undefined
    });

    res.json(payouts);
  } catch (error) {
    next(error);
  }
};

/**
 * @typedef {object} PayoutInsightsResponse
 * @property {integer} totalPayouts
 * @property {number} totalAmount
 * @property {string} currency
 * @property {integer} pendingPayouts
 */

/**
 * GET /api/v1/payouts/insights/{accountId}
 * @summary Get payout insights
 * @description Retrieves insights and statistics about payouts for a specific account
 * @tags Payouts
 * @security BearerAuth
 * @param {integer} accountId.path.required - Stripe account ID
 * @return {PayoutInsightsResponse} 200 - Payout insights
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const getPayoutInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const accountId = String(req.params['accountId']);
  const user = await getUserFromToken(req);
  const userId = user?.id;

  if (!userId) {res.status(401).json({ error: 'Unauthorized' }); return;}
  if (!accountId) {res.status(400).json({ error: 'Account ID is required.' }); return;}

  try {
    const stripe = await getOrCreateStripeClient(accountId, userId);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found.' }); return;}

    const payouts = await stripe.payouts.list({ limit: 100 });
    
    const totalAmount = payouts.data.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayouts = payouts.data.filter(p => p.status === 'pending').length;

    res.json({
      totalPayouts: payouts.data.length,
      totalAmount: totalAmount / 100, // Convert cents to unit
      currency: payouts.data[0]?.currency || 'usd',
      pendingPayouts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payouts
 * @summary Create a manual payout
 * @description Creates a manual payout to transfer funds from the Stripe account to the connected bank account
 * @tags Payouts
 * @security BearerAuth
 * @param {CreatePayoutRequest} request.body.required - Payout creation data
 * @example request - Request body example
 * {
 *   "accountId": 1,
 *   "amount": 50000,
 *   "currency": "usd",
 * }
 * @return {StripePayout} 201 - Payout created successfully
 * @example response - 201 - Success response
 * {
 *   "id": "po_1234567890",
 *   "amount": 50000,
 *   "currency": "usd",
 *   "status": "pending",
 *   "type": "bank_account",
 *   "method": "standard",
 *   "arrival_date": 1635811200,
 *   "created": 1635724800,
 *   "description": "Manual payout for week ending 2023-11-01",
 *   "automatic": false
 * }
 * @return {object} 400 - Bad Request - Invalid payout data
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const createPayout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId, amount, currency } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const payout = await payoutService.create(user.id, accountId, amount, currency);
    res.json(payout);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payouts/{payoutId}
 * @summary Retrieve a payout
 * @tags Payouts
 * @security BearerAuth
 * @param {string} payoutId.path.required - Payout ID
 * @param {integer} accountId.query.required - Stripe account ID
 * @return {StripePayout} 200 - Payout details
 * @return {object} 404 - Payout not found
 */
export const retrievePayout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { payoutId } = req.params;
    const { accountId } = req.query;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required.' }); return;
    }

    const payout = await payoutService.findById(user.id, Number(payoutId), Number(accountId as string));
    if (!payout) {res.status(404).json({ error: 'Payout not found' }); return;}

    res.json(payout);
  } catch (error) {
    next(error);
  }
};
