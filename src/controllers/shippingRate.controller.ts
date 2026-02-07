import type { Request, Response } from 'express';
import { ShippingRateService } from '../services/shippingRate.service';

const shippingRateService = new ShippingRateService();

/**
 * Shipping rate creation request.
 * @typedef {object} CreateShippingRateRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} display_name.required - Display name for the shipping rate
 * @property {string} type.required - Type of shipping rate (fixed_amount)
 * @property {object} fixed_amount.required - Fixed amount details
 * @property {integer} fixed_amount.amount.required - Amount in cents
 * @property {string} fixed_amount.currency.required - Three-letter ISO currency code
 * @property {object} delivery_estimate - Estimated delivery time
 */

/**
 * Stripe shipping rate object.
 * @typedef {object} StripeShippingRate
 * @property {string} id - Unique identifier for the shipping rate
 * @property {string} display_name - Display name for the shipping rate
 * @property {string} type - Type of shipping rate
 * @property {object} fixed_amount - Fixed amount details
 * @property {boolean} active - Whether the shipping rate is active
 * @property {number} created - Time at which the shipping rate was created
 */

/**
 * POST /api/v1/shipping-rates
 * @summary Create a new shipping rate
 * @description Creates a shipping rate that can be used for checkout sessions and invoices
 * @tags Shipping Rates
 * @security BearerAuth
 * @param {CreateShippingRateRequest} request.body.required - Shipping rate creation data
 * @return {StripeShippingRate} 201 - Shipping rate created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...shippingRateData } = req.body;
    
    const shippingRate = await shippingRateService.create(userId, stripeAccountId, shippingRateData);
    res.status(201).json(shippingRate);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/shipping-rates
 * @summary List all shipping rates for the authenticated user
 * @description Retrieves all shipping rates created by the user
 * @tags Shipping Rates
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter shipping rates.
 * @param {number} [year] year.query - A year to filter shipping rates by creation date.
 * @return {array} 200 - List of shipping rates
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getShippingRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const shippingRates = await shippingRateService.findByUser(userId, accountId, year);
    res.json(shippingRates);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/shipping-rates/{id}
 * @summary Retrieve a specific shipping rate
 * @description Retrieves the details of a shipping rate
 * @tags Shipping Rates
 * @security BearerAuth
 * @param {integer} id.path.required - Shipping rate ID
 * @return {StripeShippingRate} 200 - Shipping rate details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Shipping rate not found
 * @return {object} 500 - Internal Server Error
 */
export const getShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const shippingRate = await shippingRateService.findById(userId, id);
    if (!shippingRate) {
      res.status(404).json({ error: 'Shipping rate not found' }); return;
    }
    
    res.json(shippingRate);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * PUT /api/v1/shipping-rates/{id}
 * @summary Update a shipping rate
 * @description Updates an existing shipping rate
 * @tags Shipping Rates
 * @security BearerAuth
 * @param {integer} id.path.required - Shipping rate ID
 * @param {object} request.body.required - Update data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {StripeShippingRate} 200 - Shipping rate updated successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Shipping rate not found
 * @return {object} 500 - Internal Server Error
 */
export const updateShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId, ...updateData } = req.body;
    
    const shippingRate = await shippingRateService.update(userId, stripeAccountId, id, updateData);
    if (!shippingRate) {
      res.status(404).json({ error: 'Shipping rate not found' }); return;
    }
    
    res.json(shippingRate);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
