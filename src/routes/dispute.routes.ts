import { Router } from 'express';
import { getDisputeInsights, submitDisputeEvidence, closeDispute, getDisputes } from '../controllers/dispute.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/disputes
 * @summary Get paginated disputes
 * @tags Disputes
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter disputes.
 * @param {integer} [year] year.query - A year to filter disputes by creation date.
 */
router.get('/', getDisputes);

/**
 * GET /api/v1/disputes/insights/{accountId}
 * @summary Get dispute insights
 * @tags Disputes
 * @security BearerAuth
 */
router.get('/insights/:accountId', getDisputeInsights);

/**
 * GET /api/v1/disputes/{accountId}
 * @summary Get disputes for account
 * @tags Disputes
 * @security BearerAuth
 */
router.get('/:accountId', getDisputeInsights);

/**
 * PUT /api/v1/disputes/{disputeId}/evidence
 * @summary Submit dispute evidence
 * @tags Disputes
 * @security BearerAuth
 */
router.put('/:disputeId/evidence', submitDisputeEvidence);

/**
 * POST /api/v1/disputes/{disputeId}/close
 * @summary Close a dispute
 * @tags Disputes
 * @security BearerAuth
 */
router.post('/:disputeId/close', closeDispute);

export default router;