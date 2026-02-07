import type { Request, Response } from 'express';
import { TopUpService } from '../services/topUp.service';

const topUpService = new TopUpService();

/**
 * Top-up creation request.
 * @typedef {object} CreateTopUpRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {integer} amount.required - Amount to top up in cents
 * @property {string} currency.required - Three-letter ISO currency code
 * @property {string} description - Description for the top-up
 * @property {string} statement_descriptor - Statement descriptor
 */

/**
 * Stripe top-up object.
 * @typedef {object} StripeTopUp
 * @property {string} id - Unique identifier for the top-up
 * @property {integer} amount - Amount topped up in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} status - Status of the top-up
 * @property {string} description - Description of the top-up
 * @property {number} created - Time at which the top-up was created
 */

/**
 * POST /api/v1/topups
 * @summary Create a new top-up
 * @description Creates a top-up to add funds to your Stripe account balance
 * @tags Top-ups
 * @security BearerAuth
 * @param {CreateTopUpRequest} request.body.required - Top-up creation data
 * @return {StripeTopUp} 201 - Top-up created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createTopUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...topUpData } = req.body;
    
    const topUp = await topUpService.create(userId, stripeAccountId, topUpData);
    res.status(201).json(topUp);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/topups
 * @summary List all top-ups for the authenticated user
 * @description Retrieves all top-ups created by the user
 * @tags Top-ups
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter top-ups.
 * @param {number} [year] year.query - A year to filter top-ups by creation date.
 * @return {array} 200 - List of top-ups
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getTopUps = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const topUps = await topUpService.findByUser(userId, accountId, year);
    res.json(topUps);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/topups/{id}
 * @summary Retrieve a specific top-up
 * @description Retrieves the details of a top-up
 * @tags Top-ups
 * @security BearerAuth
 * @param {integer} id.path.required - Top-up ID
 * @return {StripeTopUp} 200 - Top-up details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Top-up not found
 * @return {object} 500 - Internal Server Error
 */
export const getTopUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const topUp = await topUpService.findById(userId, id);
    if (!topUp) {
      res.status(404).json({ error: 'Top up not found' }); return;
    }
    
    res.json(topUp);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};
