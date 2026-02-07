import { Router } from 'express';
import { listCoupons, createCoupon } from '../controllers/coupon.controller';


const router = Router();


/**
 * GET /api/v1/coupons
 * @summary List coupons
 * @tags Coupons
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter coupons.
 * @param {integer} [year] year.query - A year to filter coupons by creation date.
 */
router.get('/', listCoupons);

/**
 * POST /api/v1/coupons
 * @summary Create coupon
 * @tags Coupons
 * @security BearerAuth
 */
router.post('/', createCoupon);

export default router;