import type { Request, Response, NextFunction } from 'express';
import { findAll, create } from '../services/paymentLink.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Payment link creation request.
 * @typedef {object} CreatePaymentLinkRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {array<object>} lineItems.required - Array of line items for the payment link
 * @property {string} after_completion - Behavior after successful payment
 * @property {boolean} allow_promotion_codes - Whether to allow promotion codes
 * @property {object} automatic_tax - Automatic tax configuration
 * @property {string} billing_address_collection - Billing address collection mode
 */

/**
 * Stripe payment link object.
 * @typedef {object} StripePaymentLink
 * @property {string} id - Unique identifier for the payment link
 * @property {string} url - URL for the payment link
 * @property {boolean} active - Whether the payment link is active
 * @property {array<object>} line_items - Line items for the payment link
 * @property {string} after_completion - Post-payment behavior
 * @property {boolean} allow_promotion_codes - Whether promotion codes are allowed
 * @property {number} created - Time at which the payment link was created
 */

/**
 * GET /api/v1/payment-links
 * @summary List all payment links for the authenticated user
 * @description Retrieves all payment links created by the user
 * @tags Payment Links
 * @security BearerAuth
 * @param {integer} limit.query - Number of links to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination
 * @param {string} ending_before.query - Cursor for pagination
 * @param {boolean} active.query - Filter by active status
 * @param {number} [accountId] accountId.query - An account ID to filter payment links.
 * @param {integer} [year] year.query - A year to filter payment links by creation date (e.g., 2024).
 * @param {integer} [month] month.query - A month (1-12) to filter payment links. If omitted, filters entire year.
 * @return {object} 200 - List of payment links
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "plink_1234567890",
 *       "url": "https://buy.stripe.com/test_123456789",
 *       "active": true,
 *       "created": 1635724800
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listPaymentLinks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const links = await findAll(user.id, accountId, year, month);
    res.json(links);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payment-links
 * @summary Create a new payment link
 * @description Creates a payment link that customers can use to make payments
 * @tags Payment Links
 * @security BearerAuth
 * @param {CreatePaymentLinkRequest} request.body.required - Payment link creation data
 * @example request - Request body example
 * {
 *   "accountId": 1,
 *   "lineItems": [
 *     {
 *       "price": "price_1234567890",
 *       "quantity": 1
 *     }
 *   ],
 *   "after_completion": {
 *     "type": "redirect",
 *     "redirect": {
 *       "url": "https://example.com/success"
 *     }
 *   },
 *   "allow_promotion_codes": true
 * }
 * @return {StripePaymentLink} 201 - Payment link created successfully
 * @example response - 201 - Success response
 * {
 *   "id": "plink_1234567890",
 *   "url": "https://buy.stripe.com/test_123456789",
 *   "active": true,
 *   "line_items": [
 *     {
 *       "price": "price_1234567890",
 *       "quantity": 1
 *     }
 *   ],
 *   "allow_promotion_codes": true,
 *   "created": 1635724800
 * }
 * @return {object} 400 - Bad Request - Invalid payment link data
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const createPaymentLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId, lineItems } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient(accountId, user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems
    });

    const dbLink = await create({
      userId: user.id,
      stripeAccountId: accountId,
      stripePaymentLinkId: paymentLink.id,
      url: paymentLink.url,
      active: paymentLink.active
    });

    res.json(dbLink);
  } catch (error) {
    next(error);
  }
};
