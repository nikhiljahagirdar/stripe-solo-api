import type { Request, Response } from 'express';
import { PlanService } from '../services/plan.service';

const planService = new PlanService();

/**
 * Plan creation request object.
 * @typedef {object} CreatePlanRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} id - Unique identifier for the plan
 * @property {string} nickname.required - Display name for the plan
 * @property {integer} amount.required - Amount in cents
 * @property {string} currency.required - Three-letter ISO currency code
 * @property {string} interval.required - Billing interval (day, week, month, year)
 * @property {integer} interval_count - Number of intervals between billings
 * @property {string} product.required - Product ID this plan belongs to
 */

/**
 * Stripe plan object.
 * @typedef {object} StripePlan
 * @property {string} id - Unique identifier for the plan
 * @property {string} nickname - Display name for the plan
 * @property {integer} amount - Amount in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} interval - Billing interval
 * @property {integer} interval_count - Number of intervals between billings
 * @property {string} product - Product ID
 * @property {boolean} active - Whether the plan is active
 * @property {number} created - Time at which the plan was created
 */

/**
 * POST /api/v1/plans
 * @summary Create a new subscription plan
 * @description Creates a new subscription plan that can be used for recurring billing
 * @tags Plans
 * @security BearerAuth
 * @param {CreatePlanRequest} request.body.required - Plan creation data
 * @return {StripePlan} 201 - Plan created successfully
 * @return {object} 400 - Bad Request - Invalid plan data
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...planData } = req.body;
    
    const plan = await planService.create(userId, stripeAccountId, planData);
    res.status(201).json(plan);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/plans
 * @summary List all plans for the authenticated user
 * @description Retrieves all subscription plans created by the user
 * @tags Plans
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter plans.
 * @param {number} [year] year.query - A year to filter plans by creation date.
 * @return {array} 200 - List of plans
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const plans = await planService.findByUser(userId, accountId, year);
    res.json(plans);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/plans/{id}
 * @summary Retrieve a specific plan
 * @description Retrieves the details of a subscription plan
 * @tags Plans
 * @security BearerAuth
 * @param {integer} id.path.required - Plan ID
 * @return {StripePlan} 200 - Plan details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Plan not found
 * @return {object} 500 - Internal Server Error
 */
export const getPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const plan = await planService.findById(userId, id);
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' }); return;
    }
    
    res.json(plan);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * DELETE /api/v1/plans/{id}
 * @summary Delete a subscription plan
 * @description Deletes a subscription plan. This will also delete the plan from Stripe.
 * @tags Plans
 * @security BearerAuth
 * @param {integer} id.path.required - Plan ID
 * @param {object} request.body.required - Delete data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {object} 204 - Plan deleted successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Plan not found
 * @return {object} 500 - Internal Server Error
 */
export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId } = req.body;
    
    const deleted = await planService.delete(userId, stripeAccountId, id);
    if (!deleted) {
      res.status(404).json({ error: 'Plan not found' }); return;
    }
    
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
