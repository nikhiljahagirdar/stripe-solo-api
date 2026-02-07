import { Router } from 'express';
import { listEvents, retrieveEvent } from '../controllers/event.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/events
 * @summary List events
 * @tags Events
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter events.
 * @param {integer} [year] year.query - A year to filter events by creation date.
 */
router.get('/', listEvents);

/**
 * GET /api/v1/events/{eventId}
 * @summary Retrieve event
 * @tags Events
 * @security BearerAuth
 */
router.get('/:eventId', retrieveEvent);

export default router;