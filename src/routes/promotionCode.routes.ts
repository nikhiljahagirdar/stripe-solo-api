import { Router } from 'express';
import { listPromotionCodes, createPromotionCode } from '../controllers/promotionCode.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/promotion-codes
 * @summary List promotion codes
 * @tags Promotion Codes
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter promotion codes.
 * @param {integer} [year] year.query - A year to filter promotion codes by creation date.
 */
router.get('/', listPromotionCodes);

/**
 * POST /api/v1/promotion-codes
 * @summary Create promotion code
 * @tags Promotion Codes
 * @security BearerAuth
 */
router.post('/', createPromotionCode);

export default router;