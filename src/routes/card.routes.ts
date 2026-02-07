import { Router } from 'express';
import { listCards } from '../controllers/card.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/cards
 * @summary List cards
 * @tags Cards
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter cards.
 * @param {integer} [year] year.query - A year to filter cards by creation date.
 */
router.get('/', listCards);

export default router;