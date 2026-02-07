import { Router } from 'express';
import { listCheckoutSessions, createCheckoutSession } from '../controllers/checkout.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/checkout/sessions
 * @summary List checkout sessions
 * @tags Checkout
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter checkout sessions.
 * @param {integer} [year] year.query - A year to filter checkout sessions by creation date.
 */
router.get('/sessions', listCheckoutSessions);

/**
 * POST /api/v1/checkout/sessions
 * @summary Create checkout session
 * @tags Checkout
 * @security BearerAuth
 */
router.post('/sessions', createCheckoutSession);

export default router;