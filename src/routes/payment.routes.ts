import { Router } from 'express';
import {
  listPaymentIntents,
  createPaymentIntent,
  retrievePaymentIntent,
  createRefund,
  getTaxSettings,
  updateTaxSettings
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Use authenticate middleware for all payment routes
router.use(authenticate);


/**
 * POST /api/v1/payments
 * @summary Create a new payment intent
 * @tags Payments
 * @param {object} request.body.required - Payment intent data
 * @param {integer} request.body.accountId.required - Stripe account ID
 * @param {integer} request.body.amount.required - Amount in cents
 * @param {string} request.body.currency.required - Currency code
 * @param {string} request.body.customerId - Customer ID
 * @return {object} 201 - Payment intent created successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.post('/', createPaymentIntent);

/**
 * GET /api/v1/payments
 * @summary List all payment intents
 * @tags Payments
 * @param {integer} page.query - Page number for pagination
 * @param {integer} pageSize.query - Number of items per page
 * @param {string} query.query - Search term for filtering by customer name or payment status
 * @param {string} sort.query - Sort field and direction
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} status.query - Payment status filter
 * @param {string} currency.query - Currency filter
 * @param {string} customerName.query - Filter by customer name
 * @param {integer} [accountId] accountId.query - An account ID to filter payment intents.
 * @param {integer} [year] year.query - A year to filter payment intents by creation date.
 * @return {object} 200 - List of payment intents with pagination
 * @return {object} 401 - Unauthorized
 */
router.get('/', listPaymentIntents);

/**
 * GET /api/v1/payments/{paymentIntentId}
 * @summary Retrieve a specific payment intent
 * @tags Payments
 * @param {string} paymentIntentId.path.required - Payment intent ID
 * @param {string} accountId.query.required - Stripe account ID
 * @return {object} 200 - Payment intent details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Payment intent not found
 */
router.get('/:paymentIntentId', retrievePaymentIntent);

/**
 * POST /api/v1/payments/refunds
 * @summary Create a refund for a payment intent
 * @tags Payments
 * @param {object} request.body.required - Refund data
 * @param {string} request.body.accountId.required - Stripe account ID
 * @param {string} request.body.paymentIntentId.required - Payment intent ID
 * @param {integer} request.body.amount - Amount to refund in cents
 * @param {string} request.body.reason - Reason for refund
 * @return {object} 201 - Refund created successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.post('/refunds', createRefund);

/**
 * GET /api/v1/payments/tax-settings/{accountId}
 * @summary Get tax settings for an account
 * @tags Payments
 * @param {string} accountId.path.required - Account ID
 * @return {object} 200 - Tax settings
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Tax settings not found
 */
router.get('/tax-settings/:accountId', getTaxSettings);

/**
 * PUT /api/v1/payments/tax-settings/{accountId}
 * @summary Update tax settings for an account
 * @tags Payments
 * @param {string} accountId.path.required - Account ID
 * @param {object} request.body.required - Tax settings data
 * @return {object} 200 - Tax settings updated successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.put('/tax-settings/:accountId', updateTaxSettings);

export default router;