import type { Request, Response } from 'express';
import { TaxRateService } from '../services/taxRate.service';

const taxRateService = new TaxRateService();

/**
 * Tax rate creation request.
 * @typedef {object} CreateTaxRateRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} display_name.required - Display name of the tax rate
 * @property {number} percentage.required - Tax percentage (e.g., 8.5 for 8.5%)
 * @property {boolean} inclusive - Whether the tax is inclusive or exclusive
 * @property {string} jurisdiction - Tax jurisdiction
 * @property {string} description - Description of the tax rate
 */

/**
 * Stripe tax rate object.
 * @typedef {object} StripeTaxRate
 * @property {string} id - Unique identifier for the tax rate
 * @property {string} display_name - Display name of the tax rate
 * @property {number} percentage - Tax percentage
 * @property {boolean} inclusive - Whether the tax is inclusive
 * @property {string} jurisdiction - Tax jurisdiction
 * @property {boolean} active - Whether the tax rate is active
 * @property {number} created - Time at which the tax rate was created
 */

/**
 * POST /api/v1/tax-rates
 * @summary Create a new tax rate
 * @description Creates a new tax rate that can be applied to invoices and subscriptions
 * @tags Tax Rates
 * @security BearerAuth
 * @param {CreateTaxRateRequest} request.body.required - Tax rate creation data
 * @return {StripeTaxRate} 201 - Tax rate created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...taxRateData } = req.body;
    
    const taxRate = await taxRateService.create(userId, stripeAccountId, taxRateData);
    res.status(201).json(taxRate);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/tax-rates
 * @summary List all tax rates for the authenticated user
 * @description Retrieves all tax rates created by the user
 * @tags Tax Rates
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter tax rates.
 * @param {number} [year] year.query - A year to filter tax rates by creation date.
 * @return {array} 200 - List of tax rates
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getTaxRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const taxRates = await taxRateService.findByUser(userId, accountId, year);
    res.json(taxRates);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/tax-rates/{id}
 * @summary Retrieve a specific tax rate
 * @description Retrieves the details of a tax rate
 * @tags Tax Rates
 * @security BearerAuth
 * @param {integer} id.path.required - Tax rate ID
 * @return {StripeTaxRate} 200 - Tax rate details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Tax rate not found
 * @return {object} 500 - Internal Server Error
 */
export const getTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const taxRate = await taxRateService.findById(userId, id);
    if (!taxRate) {
      res.status(404).json({ error: 'Tax rate not found' }); return;
    }
    
    res.json(taxRate);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * PUT /api/v1/tax-rates/{id}
 * @summary Update a tax rate
 * @description Updates an existing tax rate
 * @tags Tax Rates
 * @security BearerAuth
 * @param {integer} id.path.required - Tax rate ID
 * @param {object} request.body.required - Update data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {StripeTaxRate} 200 - Tax rate updated successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Tax rate not found
 * @return {object} 500 - Internal Server Error
 */
export const updateTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId, ...updateData } = req.body;
    
    const taxRate = await taxRateService.update(userId, stripeAccountId, id, updateData);
    if (!taxRate) {
      res.status(404).json({ error: 'Tax rate not found' }); return;
    }
    
    res.json(taxRate);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
