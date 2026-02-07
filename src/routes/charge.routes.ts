import { Router } from 'express';
import { listCharges, retrieveCharge } from '../controllers/charge.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/charges
 * @summary List charges
 * @tags Charges
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter charges.
 * @param {integer} [year] year.query - A year to filter charges by creation date.
 */
router.get('/', listCharges);

/**
 * GET /api/v1/charges/{chargeId}
 * @summary Retrieve charge
 * @tags Charges
 * @security BearerAuth
 */
router.get('/:chargeId', retrieveCharge);

export default router;