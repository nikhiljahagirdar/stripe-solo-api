import type { Request, Response, NextFunction } from 'express';
import { findAll, create } from '../services/coupon.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Coupon creation request object.
 * @typedef {object} CreateCouponRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {string} id - Unique identifier for the coupon (optional, auto-generated if not provided)
 * @property {string} name - Name of the coupon displayed to customers
 * @property {number} percentOff - Percent discount (1-100, mutually exclusive with amountOff)
 * @property {number} amountOff - Fixed amount discount in cents (mutually exclusive with percentOff)
 * @property {string} currency - Currency for amountOff (required if amountOff is specified)
 * @property {string} duration.required - Duration of the coupon (forever, once, repeating)
 * @property {integer} durationInMonths - Number of months the coupon applies (required if duration is repeating)
 * @property {integer} maxRedemptions - Maximum number of times the coupon can be redeemed
 * @property {integer} redeemBy - Unix timestamp for when the coupon expires
 */

/**
 * Stripe coupon object.
 * @typedef {object} StripeCoupon
 * @property {string} id - Unique identifier for the coupon
 * @property {string} name - Name of the coupon
 * @property {number} percent_off - Percent discount (if applicable)
 * @property {number} amount_off - Fixed amount discount in cents (if applicable)
 * @property {string} currency - Currency for amount_off
 * @property {string} duration - Duration of the coupon
 * @property {integer} duration_in_months - Number of months (if duration is repeating)
 * @property {integer} max_redemptions - Maximum redemptions allowed
 * @property {integer} times_redeemed - Number of times redeemed
 * @property {boolean} valid - Whether the coupon is valid
 * @property {number} created - Time at which the coupon was created
 */

/**
 * GET /api/v1/coupons
 * @summary List all coupons for the authenticated user
 * @description Retrieves a list of all coupons created by the user across their Stripe accounts
 * @tags Coupons
 * @security BearerAuth
 * @param {integer} limit.query - Number of coupons to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination (coupon ID)
 * @param {string} ending_before.query - Cursor for pagination (coupon ID)
 * @param {number} [accountId] accountId.query - An account ID to filter coupons.
 * @param {integer} [year] year.query - A year to filter coupons by creation date (e.g., 2024).
 * @param {integer} [month] month.query - A month (1-12) to filter coupons. If omitted, filters entire year.
 * @return {object} 200 - List of coupons
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "25OFF",
 *       "name": "25% off",
 *       "percent_off": 25,
 *       "duration": "once",
 *       "valid": true,
 *       "times_redeemed": 15,
 *       "max_redemptions": 100,
 *       "created": 1635724800
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const coupons = await findAll(user.id, accountId, year, month);
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/coupons
 * @summary Create a new coupon
 * @description Creates a new coupon that can be applied to invoices or subscriptions for discounts
 * @tags Coupons
 * @security BearerAuth
 * @param {CreateCouponRequest} request.body.required - Coupon creation data
 * @example request - Request body example
 * {
 *   "accountId": 1,
 *   "id": "SUMMER25",
 *   "name": "Summer Sale 25% Off",
 *   "percentOff": 25,
 *   "duration": "once",
 *   "maxRedemptions": 100,
 *   "redeemBy": 1672531200
 * }
 * @return {StripeCoupon} 201 - Coupon created successfully
 * @example response - 201 - Success response
 * {
 *   "id": "SUMMER25",
 *   "name": "Summer Sale 25% Off",
 *   "percent_off": 25,
 *   "duration": "once",
 *   "max_redemptions": 100,
 *   "times_redeemed": 0,
 *   "valid": true,
 *   "created": 1635724800,
 *   "redeem_by": 1672531200
 * }
 * @return {object} 400 - Bad Request - Invalid coupon data
 * @example response - 400 - Invalid data
 * {
 *   "error": "Either percent_off or amount_off must be specified, but not both"
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId, id, name, percentOff, amountOff, currency, duration } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient(accountId, user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    const coupon = await stripe.coupons.create({
      id,
      name,
      percent_off: percentOff,
      amount_off: amountOff,
      currency,
      duration
    });

    const dbCoupon = await create({
      userId: user.id,
      stripeCouponId: coupon.id,
      name: coupon.name,
      percentOff: coupon.percent_off ? coupon.percent_off.toString() : null,
      amountOff: coupon.amount_off ? (coupon.amount_off / 100).toString() : null,
      currency: coupon.currency,
      duration: coupon.duration,
      valid: coupon.valid
    });

    res.json(dbCoupon);
  } catch (error) {
    next(error);
  }
};
