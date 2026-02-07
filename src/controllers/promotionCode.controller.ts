import type { Request, Response, NextFunction } from 'express';
import { findAll, create } from '../services/promotionCode.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Promotion code creation request.
 * @typedef {object} CreatePromotionCodeRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {string} couponId.required - Coupon ID to create promotion code for
 * @property {string} code - Custom code (optional, auto-generated if not provided)
 * @property {integer} max_redemptions - Maximum number of times this code can be redeemed
 * @property {object} restrictions - Restrictions for the promotion code
 */

/**
 * Stripe promotion code object.
 * @typedef {object} StripePromotionCode
 * @property {string} id - Unique identifier for the promotion code
 * @property {string} code - The customer-facing code
 * @property {string} coupon - ID of the coupon this promotion code applies
 * @property {boolean} active - Whether the promotion code is active
 * @property {integer} max_redemptions - Maximum redemptions allowed
 * @property {integer} times_redeemed - Number of times redeemed
 * @property {number} created - Time at which the promotion code was created
 */

/**
 * GET /api/v1/promotion-codes
 * @summary List all promotion codes for the authenticated user
 * @description Retrieves all promotion codes created by the user
 * @tags Promotion Codes
 * @security BearerAuth
 * @param {integer} limit.query - Number of codes to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination
 * @param {string} ending_before.query - Cursor for pagination
 * @param {boolean} active.query - Filter by active status
 * @param {number} [accountId] accountId.query - An account ID to filter promotion codes.
 * @param {number} [year] year.query - A year to filter promotion codes by creation date (e.g., 2024).
 * @param {number} [month] month.query - A month (1-12) to filter promotion codes. If omitted, filters entire year.
 * @return {object} 200 - List of promotion codes
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "promo_1234567890",
 *       "code": "SAVE20",
 *       "coupon": "25OFF",
 *       "active": true,
 *       "max_redemptions": 100,
 *       "times_redeemed": 15,
 *       "created": 1635724800
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listPromotionCodes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const codes = await findAll(user.id, accountId, year, month);
    res.json(codes);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/promotion-codes
 * @summary Create a new promotion code
 * @description Creates a promotion code that customers can use to apply a coupon to their purchase
 * @tags Promotion Codes
 * @security BearerAuth
 * @param {CreatePromotionCodeRequest} request.body.required - Promotion code creation data
 * @example request - Request body example
 * {
 *   "accountId": 1,
 *   "couponId": "25OFF",
 *   "code": "SAVE20",
 *   "max_redemptions": 100,
 *   "restrictions": {
 *     "first_time_transaction": true,
 *     "minimum_amount": 1000,
 *     "minimum_amount_currency": "usd"
 *   }
 * }
 * @return {StripePromotionCode} 201 - Promotion code created successfully
 * @example response - 201 - Success response
 * {
 *   "id": "promo_1234567890",
 *   "code": "SAVE20",
 *   "coupon": "25OFF",
 *   "active": true,
 *   "max_redemptions": 100,
 *   "times_redeemed": 0,
 *   "created": 1635724800,
 *   "restrictions": {
 *     "first_time_transaction": true,
 *     "minimum_amount": 1000,
 *     "minimum_amount_currency": "usd"
 *   }
 * }
 * @return {object} 400 - Bad Request - Invalid promotion code data
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account or coupon not found
 * @return {object} 500 - Internal Server Error
 */
export const createPromotionCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId, couponId, code } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient(String(accountId), user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    const promotionCode = await stripe.promotionCodes.create({
      promotion: {
        coupon: couponId,
        type: 'coupon'
      },
      code
    });

    const dbCode = await create({
      userId: user.id,
      stripePromotionCodeId: promotionCode.id,
      stripeCouponId: couponId,
      code: promotionCode.code,
      active: promotionCode.active
    });

    res.json(dbCode);
  } catch (error) {
    next(error);
  }
};
