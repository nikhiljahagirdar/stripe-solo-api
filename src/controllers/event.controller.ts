import type { Request, Response, NextFunction } from 'express';
import { findAll } from '../services/event.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Stripe event object.
 * @typedef {object} StripeEvent
 * @property {string} id - Unique identifier for the event
 * @property {string} type - Type of event (e.g., payment_intent.succeeded, customer.created)
 * @property {object} data - Event data containing the object that triggered the event
 * @property {number} created - Time at which the event was created
 * @property {boolean} livemode - Whether this event was created in live mode
 * @property {integer} api_version - API version used to render the event data
 * @property {string} request - ID of the request that caused the event
 * @property {integer} pending_webhooks - Number of pending webhook deliveries
 */

/**
 * GET /api/v1/events
 * @summary List all events for the authenticated user
 * @description Retrieves a list of events that have occurred in the user's Stripe accounts. Events are ordered by creation date, with the most recent events appearing first.
 * @tags Events
 * @security BearerAuth
 * @param {integer} limit.query - Number of events to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination (event ID)
 * @param {string} ending_before.query - Cursor for pagination (event ID)
 * @param {string} type.query - Filter by event type (e.g., payment_intent.succeeded)
 * @param {number} created.query - Filter by creation date (Unix timestamp)
 * @param {number} [accountId] accountId.query - An account ID to filter events.
 * @param {integer} [year] year.query - A year to filter events by creation date (e.g., 2024).
 * @param {integer} [month] month.query - A month (1-12) to filter events. If omitted, filters entire year.
 * @return {object} 200 - List of events
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "evt_1234567890",
 *       "type": "payment_intent.succeeded",
 *       "created": 1635724800,
 *       "livemode": false,
 *       "api_version": "2020-08-27",
 *       "data": {
 *         "object": {
 *           "id": "pi_1234567890",
 *           "amount": 2000,
 *           "currency": "usd",
 *           "status": "succeeded"
 *         }
 *       },
 *       "pending_webhooks": 1
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const events = await findAll(user.id, accountId, year, month);
    res.json(events);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events/{eventId}
 * @summary Retrieve a specific event
 * @description Retrieves the details of an event that has previously occurred. Most events are available for retrieval for up to 30 days.
 * @tags Events
 * @security BearerAuth
 * @param {string} eventId.path.required - The ID of the event to retrieve
 * @param {string} accountId.query.required - Stripe account ID
 * @return {StripeEvent} 200 - Event details
 * @example response - 200 - Success response
 * {
 *   "id": "evt_1234567890",
 *   "type": "payment_intent.succeeded",
 *   "created": 1635724800,
 *   "livemode": false,
 *   "api_version": "2020-08-27",
 *   "data": {
 *     "object": {
 *       "id": "pi_1234567890",
 *       "amount": 2000,
 *       "currency": "usd",
 *       "status": "succeeded",
 *       "customer": "cus_1234567890",
 *       "payment_method": "pm_1234567890"
 *     },
 *     "previous_attributes": {
 *       "status": "requires_confirmation"
 *     }
 *   },
 *   "request": {
 *     "id": "req_1234567890",
 *     "idempotency_key": "key_1234567890"
 *   },
 *   "pending_webhooks": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Event or account not found
 * @return {object} 500 - Internal Server Error
 */
export const retrieveEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const eventId = String(req.params['eventId']);
    const accountId = req.query['accountId'] ? String(req.query['accountId']) : undefined;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient(accountId || '', user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    const event = await stripe.events.retrieve(eventId);
    res.json(event);
  } catch (error) {
    next(error);
  }
};
