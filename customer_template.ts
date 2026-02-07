import type { Request, Response, NextFunction } from 'express';
import { findAll, findById } from '../services/charge.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Stripe charge object.
 * @typedef {object} StripeCharge
 * @property {string} id - Unique identifier for the charge
 * @property {number} amount - Amount charged in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} status - Status of the charge (succeeded, pending, failed)
 * @property {string} customer - ID of the customer this charge is for
 * @property {string} description - Description of the charge
 * @property {object} payment_method - Payment method used for the charge
 * @property {number} created - Time at which the charge was created
 * @property {boolean} paid - Whether the charge has been paid
 * @property {boolean} refunded - Whether the charge has been refunded
 * @property {object} billing_details - Billing information associated with the payment method
 * @property {object} outcome - Details about the charge outcome
 */

/**
 * GET /api/v1/charges
 * @summary List all charges for the authenticated user
 * @description Retrieves a list of all charges associated with the user's Stripe accounts with filtering options
 * @tags Charges
 * @security BearerAuth
 * @param {integer} limit.query - Number of charges to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination (charge ID)
 * @param {string} ending_before.query - Cursor for pagination (charge ID)
 * @param {string} customer.query - Filter by customer ID
 * @param {string} status.query - Filter by charge status (succeeded, pending, failed)
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} currency.query - Filter by currency (usd, eur, gbp)
 * @param {integer} amount_gte.query - Filter charges with amount greater than or equal to (in cents)
 * @param {integer} amount_lte.query - Filter charges with amount less than or equal to (in cents)
 * @param {number} [accountId] accountId.query - An account ID to filter charges.
 * @param {number} [year] year.query - A year to filter charges by creation date.
 * @param {number} [month] month.query - A month (1-12) to filter charges. If omitted, filters entire year.
 * @return {object} 200 - List of charges
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "ch_1234567890",
 *       "amount": 2000,
 *       "currency": "usd",
 *       "status": "succeeded",
 *       "customer": "cus_1234567890",
 *       "description": "Payment for order #1234",
 *       "created": 1635724800,
 *       "paid": true,
 *       "refunded": false,
 *       "outcome": {
 *         "network_status": "approved_by_network",
 *         "type": "authorized"
 *       }
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @example response - 401 - Unauthorized
 * {
 *   "error": "Unauthorized"
 * }
 * @return {object} 500 - Internal Server Error
 */
export const listCharges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const charges = await findAll(user.id, accountId, year, month);
    res.json(charges);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/charges/{chargeId}
 * @summary Retrieve a specific charge
 * @description Retrieves the details of a charge that has previously been created
 * @tags Charges
 * @security BearerAuth
 * @param {string} chargeId.path.required - The ID of the charge to retrieve
 * @return {StripeCharge} 200 - Charge details
 * @example response - 200 - Success response
 * {
 *   "id": "ch_1234567890",
 *   "amount": 2000,
 *   "currency": "usd",
 *   "status": "succeeded",
 *   "customer": "cus_1234567890",
 *   "description": "Payment for order #1234",
 *   "payment_method": {
 *     "id": "pm_1234567890",
 *     "type": "card",
 *     "card": {
 *       "brand": "visa",
 *       "last4": "4242"
 *     }
 *   },
 *   "created": 1635724800,
 *   "paid": true,
 *   "refunded": false,
 *   "billing_details": {
 *     "name": "John Doe",
 *     "email": "john@example.com"
 *   },
 *   "outcome": {
 *     "network_status": "approved_by_network",
 *     "type": "authorized"
 *   }
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Charge not found
 * @example response - 404 - Charge not found
 * {
 *   "error": "Charge not found"
 * }
 * @return {object} 500 - Internal Server Error
 */
export const retrieveCharge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { chargeId } = req.params;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const charge = await findById(Number(chargeId), user.id);
    if (!charge) {res.status(404).json({ error: 'Charge not found' }); return;}

    res.json(charge);
  } catch (error) {
    next(error);
  }
};
