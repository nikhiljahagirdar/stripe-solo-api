import { Router } from 'express';
import { getTaxSettings, upsertTaxSettings } from '../controllers/tax.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/tax-settings/{accountId}
 * @summary Get tax settings
 * @tags Tax
 * @security BearerAuth
 */
router.get('/settings/:accountId', getTaxSettings);

/**
 * POST /api/v1/tax-settings/{accountId}
 * @summary Create or update tax settings
 * @tags Tax
 * @security BearerAuth
 */
router.post('/settings/:accountId', upsertTaxSettings);

export default router;