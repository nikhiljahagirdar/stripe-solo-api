import { Router } from 'express';
import { listSubscriptions, listAllSubscriptions, createNewSubscription, retrieveSubscription, updateSubscription, cancelSubscription } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/v1/subscriptions
 * @summary List all subscriptions with customer and price details
 * @tags Subscriptions
 * @param {integer} page.query - Page number for pagination
 * @param {integer} pageSize.query - Number of items per page
 * @param {string} query.query - Search term for customer name or subscription status
 * @param {string} sort.query - Sort field and direction (e.g., createdAt:desc, status:asc)
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} status.query - Filter by subscription status (active, past_due, canceled, etc.)
 * @param {string} customerName.query - Filter by customer name
 * @param {string} priceId.query - Filter by price ID
 * @param {string} interval.query - Filter by billing interval (day, week, month, year)
 * @param {integer} quantity.query - Filter by quantity
 * @param {string} currentPeriodStart.query - Filter by current period start date
 * @param {string} currentPeriodEnd.query - Filter by current period end date
 * @param {integer} [accountId] accountId.query - An account ID to filter subscriptions.
 * @param {integer} [year] year.query - A year to filter subscriptions by creation date.
 * @return {object} 200 - List of subscriptions with customer and price details
 * @return {object} 401 - Unauthorized
 */
router.get('/',  listSubscriptions);

/**
 * GET /api/v1/subscriptions/all
 * @summary List all subscriptions with price ID and product name concatenated
 * @tags Subscriptions
 * @return {array<object>} 200 - List of all subscriptions with concatenated price and product info
 * @return {object} 401 - Unauthorized
 */
router.get('/all', authenticate, listAllSubscriptions);

/**
 * POST /api/v1/subscriptions
 * @summary Create a new subscription
 * @tags Subscriptions
 */
router.post('/',  createNewSubscription);

/**
 * GET /api/v1/subscriptions/{subscriptionId}
 * @summary Retrieve a subscription
 * @tags Subscriptions
 */
router.get('/:subscriptionId',  retrieveSubscription);

/**
 * PUT /api/v1/subscriptions/{subscriptionId}
 * @summary Update a subscription
 * @tags Subscriptions
 */
router.put('/:subscriptionId',  updateSubscription);

/**
 * DELETE /api/v1/subscriptions/{subscriptionId}
 * @summary Cancel a subscription
 * @tags Subscriptions
 */
router.delete('/:subscriptionId',  cancelSubscription);

export default router;