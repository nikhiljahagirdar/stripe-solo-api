import { Router } from 'express';
import { handleWebhook } from '../controllers/webhook.controller';

const router = Router();

/**
 * POST /api/v1/webhooks/{accountId}
 * @summary Handle Stripe webhook
 * @tags Webhooks
 */
router.post('/:accountId', handleWebhook);

export default router;