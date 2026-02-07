import type { Request, Response, NextFunction } from 'express';
import { findAll, create } from '../services/checkout.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Checkout session creation request.
 * @typedef {object} CreateCheckoutSessionRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {string} successUrl.required - URL to redirect after successful payment
 * @property {string} cancelUrl.required - URL to redirect after canceled payment
 * @property {array<object>} lineItems.required - Array of line items for the session
 * @property {string} mode.required - Mode of the session (payment, setup, subscription)
 * @property {string} customer - Customer ID
 * @property {string} customer_email - Customer email
 */

/**
 * Stripe checkout session object.
 * @typedef {object} StripeCheckoutSession
 * @property {string} id - Unique identifier for the session
 * @property {string} status - Status of the session
 * @property {string} url - URL to redirect the customer to
 * @property {string} mode - Mode of the session
 * @property {string} success_url - Success redirect URL
 * @property {string} cancel_url - Cancel redirect URL
 * @property {number} created - Time at which the session was created
 */

/**
 * GET /api/v1/checkout/sessions
 * @summary List all checkout sessions for the authenticated user
 * @description Retrieves all checkout sessions created by the user
 * @tags Checkout
 * @security BearerAuth
 * @param {integer} limit.query - Number of sessions to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination
 * @param {string} ending_before.query - Cursor for pagination
 * @param {number} [accountId] accountId.query - An account ID to filter checkout sessions.
 * @param {integer} [year] year.query - A year to filter checkout sessions by creation date (e.g., 2024).
 * @param {integer} [month] month.query - A month (1-12) to filter checkout sessions. If omitted, filters entire year.
 * @return {object} 200 - List of checkout sessions
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "cs_1234567890",
 *       "status": "complete",
 *       "url": "https://checkout.stripe.com/pay/cs_1234567890",
 *       "mode": "payment",
 *       "created": 1635724800
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listCheckoutSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const sessions = await findAll(user.id, accountId, year, month);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/checkout/sessions
 * @summary Create a new checkout session
 * @description Creates a Stripe Checkout session for accepting payments
 * @tags Checkout
 * @security BearerAuth
 * @param {CreateCheckoutSessionRequest} request.body.required - Checkout session creation data
 * @example request - Request body example
 * {
 *   "accountId": 1,
 *   "successUrl": "https://example.com/success",
 *   "cancelUrl": "https://example.com/cancel",
 *   "lineItems": [
 *     {
 *       "price": "price_1234567890",
 *       "quantity": 1
 *     }
 *   ],
 *   "mode": "payment",
 *   "customer_email": "customer@example.com"
 * }
 * @return {StripeCheckoutSession} 201 - Checkout session created successfully
 * @example response - 201 - Success response
 * {
 *   "id": "cs_1234567890",
 *   "status": "open",
 *   "url": "https://checkout.stripe.com/pay/cs_1234567890",
 *   "mode": "payment",
 *   "success_url": "https://example.com/success",
 *   "cancel_url": "https://example.com/cancel",
 *   "created": 1635724800
 * }
 * @return {object} 400 - Bad Request - Invalid session data
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId, successUrl, cancelUrl, lineItems, mode } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient(accountId, user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    const session = await stripe.checkout.sessions.create({
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: lineItems,
      mode
    });

    const dbSession = await create({
      userId: user.id,
      stripeAccountId: accountId,
      stripeSessionId: session.id,
      status: session.status,
      url: session.url,
      mode: session.mode
    });

    res.json(dbSession);
  } catch (error) {
    next(error);
  }
};
