import type { Request, Response } from 'express';
import { CustomerSessionService } from '../services/customerSession.service';

const customerSessionService = new CustomerSessionService();

/**
 * Customer session creation request.
 * @typedef {object} CreateCustomerSessionRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} customer.required - Customer ID
 * @property {object} components.required - Components to enable in the session
 * @property {object} components.pricing_table - Pricing table component configuration
 * @property {object} components.payment_element - Payment element component configuration
 */

/**
 * Stripe customer session object.
 * @typedef {object} StripeCustomerSession
 * @property {string} id - Unique identifier for the customer session
 * @property {string} customer - Customer ID
 * @property {string} client_secret - Client secret for the session
 * @property {object} components - Enabled components
 * @property {number} expires_at - Time at which the session expires
 * @property {number} created - Time at which the session was created
 */

/**
 * POST /api/v1/customer-sessions
 * @summary Create a new customer session
 * @description Creates a customer session for embedded components like pricing tables
 * @tags Customer Sessions
 * @security BearerAuth
 * @param {CreateCustomerSessionRequest} request.body.required - Customer session creation data
 * @return {StripeCustomerSession} 201 - Customer session created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createCustomerSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...sessionData } = req.body;
    
    const session = await customerSessionService.create(userId, stripeAccountId, sessionData);
    res.status(201).json(session);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/customer-sessions
 * @summary List all customer sessions for the authenticated user
 * @description Retrieves all customer sessions created by the user
 * @tags Customer Sessions
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter customer sessions.
 * @param {number} [year] year.query - A year to filter customer sessions by creation date.
 * @return {array} 200 - List of customer sessions
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getCustomerSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const sessions = await customerSessionService.findByUser(userId, accountId, year);
    res.json(sessions);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/customer-sessions/{id}
 * @summary Retrieve a specific customer session
 * @description Retrieves the details of a customer session
 * @tags Customer Sessions
 * @security BearerAuth
 * @param {integer} id.path.required - Customer session ID
 * @return {StripeCustomerSession} 200 - Customer session details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Customer session not found
 * @return {object} 500 - Internal Server Error
 */
export const getCustomerSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const session = await customerSessionService.findById(userId, id);
    if (!session) {
      res.status(404).json({ error: 'Customer session not found' }); return;
    }
    
    res.json(session);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};
