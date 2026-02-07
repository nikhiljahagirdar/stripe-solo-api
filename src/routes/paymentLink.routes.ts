import { Router } from 'express';
import { listPaymentLinks, createPaymentLink } from '../controllers/paymentLink.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/payment-links
 * @summary List payment links
 * @tags Payment Links
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter payment links.
 * @param {integer} [year] year.query - A year to filter payment links by creation date.
 */
router.get('/', listPaymentLinks);

/**
 * POST /api/v1/payment-links
 * @summary Create payment link
 * @tags Payment Links
 * @security BearerAuth
 */
router.post('/', createPaymentLink);

export default router;