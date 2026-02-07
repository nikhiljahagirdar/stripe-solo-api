import type { Request, Response } from 'express';
import { TaxCodeService } from '../services/taxCode.service';

const taxCodeService = new TaxCodeService();

/**
 * Stripe tax code object.
 * @typedef {object} StripeTaxCode
 * @property {string} id - Unique identifier for the tax code
 * @property {string} name - Name of the tax code
 * @property {string} description - Description of what the tax code covers
 */

/**
 * Tax code sync request.
 * @typedef {object} SyncTaxCodeRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} stripeTaxCodeId.required - Stripe tax code ID to sync
 */

/**
 * GET /api/v1/tax-codes
 * @summary List all tax codes for the authenticated user
 * @description Retrieves all tax codes available for the user's Stripe accounts
 * @tags Tax Codes
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter tax codes.
 * @param {number} [year] year.query - A year to filter tax codes by creation date.
 * @return {array} 200 - List of tax codes
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getTaxCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const taxCodes = await taxCodeService.findByUser(userId, accountId, year);
    res.json(taxCodes);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/tax-codes/{id}
 * @summary Retrieve a specific tax code
 * @description Retrieves the details of a tax code
 * @tags Tax Codes
 * @security BearerAuth
 * @param {integer} id.path.required - Tax code ID
 * @return {StripeTaxCode} 200 - Tax code details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Tax code not found
 * @return {object} 500 - Internal Server Error
 */
export const getTaxCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const taxCode = await taxCodeService.findById(userId, id);
    if (!taxCode) {
      res.status(404).json({ error: 'Tax code not found' }); return;
    }
    
    res.json(taxCode);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/tax-codes/sync
 * @summary Sync a tax code from Stripe
 * @description Retrieves a tax code from Stripe and creates or updates it in the local database
 * @tags Tax Codes
 * @security BearerAuth
 * @param {SyncTaxCodeRequest} request.body.required - Tax code sync data
 * @return {StripeTaxCode} 200 - Tax code synced successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const syncTaxCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, stripeTaxCodeId } = req.body;
    
    const taxCode = await taxCodeService.syncFromStripe(userId, stripeAccountId, stripeTaxCodeId);
    res.json(taxCode);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
