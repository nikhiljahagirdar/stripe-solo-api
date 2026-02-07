import type { Request, Response } from 'express';
import { SubscriptionScheduleService } from '../services/subscriptionSchedule.service';

const subscriptionScheduleService = new SubscriptionScheduleService();

/**
 * Subscription schedule creation request.
 * @typedef {object} CreateSubscriptionScheduleRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} customer.required - Customer ID
 * @property {array<object>} phases.required - Array of schedule phases
 * @property {integer} start_date - Unix timestamp for when the schedule starts
 * @property {string} end_behavior - Behavior when the schedule ends
 */

/**
 * POST /api/v1/subscription-schedules
 * @summary Create a new subscription schedule
 * @description Creates a subscription schedule to manage subscription changes over time
 * @tags Subscription Schedules
 * @security BearerAuth
 * @param {CreateSubscriptionScheduleRequest} request.body.required - Subscription schedule creation data
 * @return {object} 201 - Subscription schedule created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createSubscriptionSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...scheduleData } = req.body;
    
    const schedule = await subscriptionScheduleService.create(userId, stripeAccountId, scheduleData);
    res.status(201).json(schedule);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/subscription-schedules
 * @summary List all subscription schedules for the authenticated user
 * @description Retrieves all subscription schedules created by the user
 * @tags Subscription Schedules
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter subscription schedules.
 * @param {number} [year] year.query - A year to filter subscription schedules by creation date.
 * @return {array<object>} 200 - List of subscription schedules
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getSubscriptionSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const schedules = await subscriptionScheduleService.findByUser(userId, accountId, year);
    res.json(schedules);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/subscription-schedules/{id}
 * @summary Retrieve a specific subscription schedule
 * @description Retrieves the details of a subscription schedule
 * @tags Subscription Schedules
 * @security BearerAuth
 * @param {integer} id.path.required - Subscription schedule ID
 * @return {object} 200 - Subscription schedule details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Subscription schedule not found
 * @return {object} 500 - Internal Server Error
 */
export const getSubscriptionSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const schedule = await subscriptionScheduleService.findById(userId, id);
    if (!schedule) {
      res.status(404).json({ error: 'Subscription schedule not found' }); return;
    }
    
    res.json(schedule);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/subscription-schedules/{id}/cancel
 * @summary Cancel a subscription schedule
 * @description Cancels a subscription schedule and optionally the underlying subscription
 * @tags Subscription Schedules
 * @security BearerAuth
 * @param {integer} id.path.required - Subscription schedule ID
 * @param {object} request.body.required - Cancel data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {object} 200 - Subscription schedule canceled successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Subscription schedule not found
 * @return {object} 500 - Internal Server Error
 */
export const cancelSubscriptionSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId } = req.body;
    
    const schedule = await subscriptionScheduleService.cancel(userId, stripeAccountId, id);
    if (!schedule) {
      res.status(404).json({ error: 'Subscription schedule not found' }); return;
    }
    
    res.json(schedule);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
