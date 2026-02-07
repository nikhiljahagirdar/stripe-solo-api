import type { Request, Response } from 'express';
import { ApplicationFeeService } from '../services/applicationFee.service';

const applicationFeeService = new ApplicationFeeService();

/**
 * Application fee sync request.
 * @typedef {object} SyncApplicationFeeRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} stripeApplicationFeeId.required - Stripe application fee ID to sync
 */

/**
 * GET /api/v1/application-fees
 * @summary List all application fees for the authenticated user
 * @description Retrieves all application fees from the user's Stripe accounts
 * @tags Application Fees
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter application fees.
 * @param {number} [year] year.query - A year to filter application fees by creation date.
 * @return {array} 200 - List of application fees
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getApplicationFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const fees = await applicationFeeService.findByUser(userId, accountId, year);
    res.json(fees);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/application-fees/{id}
 * @summary Retrieve a specific application fee
 * @description Retrieves the details of an application fee
 * @tags Application Fees
 * @security BearerAuth
 * @param {integer} id.path.required - Application fee ID
 * @return {object} 200 - Application fee details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Application fee not found
 * @return {object} 500 - Internal Server Error
 */
export const getApplicationFee = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const fee = await applicationFeeService.findById(userId, id);
    if (!fee) {
      res.status(404).json({ error: 'Application fee not found' }); return;
    }
    
    res.json(fee);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/application-fees/sync
 * @summary Sync an application fee from Stripe
 * @description Retrieves an application fee from Stripe and creates or updates it in the local database
 * @tags Application Fees
 * @security BearerAuth
 * @param {SyncApplicationFeeRequest} request.body.required - Application fee sync data
 * @return {object} 200 - Application fee synced successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const syncApplicationFee = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, stripeApplicationFeeId } = req.body;
    
    const fee = await applicationFeeService.syncFromStripe(userId, stripeAccountId, stripeApplicationFeeId);
    res.json(fee);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
