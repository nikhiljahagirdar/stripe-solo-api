import type { Request, Response } from 'express';
import { PriceService } from '../services/price.service';
import type Stripe from 'stripe';

/**
 * Local price object.
 * @typedef {object} LocalPrice
 * @property {integer} id - Database ID
 * @property {integer} userId - User ID who owns the price
 * @property {string} stripeProductId - Associated Stripe product ID
 * @property {string} stripePriceId - Stripe price identifier
 * @property {number} unitAmount - Price amount in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} recurringInterval - Recurring interval (month, year, etc.)
 * @property {boolean} active - Whether the price is currently active
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * Price creation request.
 * @typedef {object} CreatePriceRequest
 * @property {integer} stripeAccountId.required - Stripe account database ID
 * @property {string} currency.required - Three-letter ISO currency code (e.g., usd, eur)
 * @property {string} product.required - Stripe product ID this price is for
 * @property {integer} unit_amount - Amount in cents (e.g., 2000 for $20.00)
 * @property {string} recurring.interval - Billing frequency (day, week, month, year)
 * @property {integer} recurring.interval_count - Number of intervals between billings
 * @property {string} nickname - Brief description of the price
 * @property {object} metadata - Set of key-value pairs for metadata
 */

/**
 * Price update request.
 * @typedef {object} UpdatePriceRequest
 * @property {integer} stripeAccountId.required - Stripe account database ID
 * @property {boolean} active - Whether the price can be used for new purchases
 * @property {string} nickname - Brief description of the price
 * @property {object} metadata - Set of key-value pairs for metadata
 */

const priceService = new PriceService();

/**
 * POST /api/v1/prices
 * @summary Create a new Stripe price
 * @description Creates a new price object on Stripe and saves a corresponding record in the local database
 * @tags Prices
 * @security BearerAuth
 * @param {CreatePriceRequest} request.body.required - Price creation data
 * @return {LocalPrice} 201 - Price created successfully
 * @example response - 201 - Success response
 * {
 *   "id": 1,
 *   "userId": 123,
 *   "stripeProductId": "prod_NqgYp2s5Y6a7Z8",
 *   "stripePriceId": "price_1234567890",
 *   "unitAmount": 2000,
 *   "currency": "usd",
 *   "recurringInterval": "month",
 *   "active": true,
 *   "created_at": "2024-01-01T00:00:00.000Z"
 * }
 * @return {object} 400 - Bad Request - Missing required fields
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const createPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { stripeAccountId, ...priceData }: { stripeAccountId: number } & Stripe.PriceCreateParams = req.body;

    if (!stripeAccountId || !priceData.currency || !priceData.product) {
      res.status(400).json({ message: 'Missing required fields: stripeAccountId, currency, product.' }); return;
    }

    const price = await priceService.create(userId, stripeAccountId, priceData);
    res.status(201).json(price);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * PATCH /api/v1/prices/{id}
 * @summary Update a Stripe price
 * @description Updates a price object on Stripe and syncs the changes to the local database. Note: You can only update the active status and metadata
 * @tags Prices
 * @security BearerAuth
 * @param {integer} id.path.required - Database ID of the price to update
 * @param {UpdatePriceRequest} request.body.required - Price update data
 * @return {LocalPrice} 200 - Price updated successfully
 * @example response - 200 - Success response
 * {
 *   "id": 1,
 *   "stripePriceId": "price_1234567890",
 *   "active": false,
 *   "nickname": "Updated price",
 *   "unitAmount": 2000,
 *   "currency": "usd",
 *   "updated_at": "2024-01-15T10:30:00.000Z"
 * }
 * @return {object} 400 - Bad Request - Invalid parameters
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Price not found
 * @return {object} 500 - Internal Server Error
 */
export const updatePrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { id } = req.params;
    const { stripeAccountId, ...updateData }: { stripeAccountId: number } & Stripe.PriceUpdateParams = req.body;

    if (!stripeAccountId) {
      res.status(400).json({ message: 'stripeAccountId is required.' }); return;
    }

    const price = await priceService.update(userId, stripeAccountId, +id!, updateData);
    if (!price) {
      res.status(404).json({ message: 'Price not found.' }); return;
    }
    res.status(200).json(price);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * GET /api/v1/prices
 * @summary List all prices for the authenticated user
 * @description Retrieves a list of all prices associated with the authenticated user, with optional filtering by account and year
 * @tags Prices
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - Filter by Stripe account database ID
 * @param {integer} [year] year.query - Filter by creation year
 * @return {array<LocalPrice>} 200 - List of prices retrieved successfully
 * @example response - 200 - Success response
 * [
 *   {
 *     "id": 1,
 *     "userId": 123,
 *     "stripePriceId": "price_1234567890",
 *     "stripeProductId": "prod_ABC123",
 *     "unitAmount": 2000,
 *     "currency": "usd",
 *     "recurringInterval": "month",
 *     "active": true
 *   },
 *   {
 *     "id": 2,
 *     "stripePriceId": "price_0987654321",
 *     "unitAmount": 5000,
 *     "currency": "usd",
 *     "recurringInterval": "year",
 *     "active": true
 *   }
 * ]
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const getAllPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const prices = await priceService.findByUser(userId, accountId, year);
    res.status(200).json(prices);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * GET /api/v1/prices/{id}
 * @summary Get a specific price by database ID
 * @description Retrieves detailed information about a specific price by its database ID
 * @tags Prices
 * @security BearerAuth
 * @param {integer} id.path.required - Database ID of the price to retrieve
 * @return {LocalPrice} 200 - Price details retrieved successfully
 * @example response - 200 - Success response
 * {
 *   "id": 1,
 *   "userId": 123,
 *   "stripePriceId": "price_1234567890",
 *   "stripeProductId": "prod_ABC123",
 *   "unitAmount": 2000,
 *   "currency": "usd",
 *   "recurringInterval": "month",
 *   "active": true,
 *   "nickname": "Monthly Premium Plan",
 *   "created_at": "2024-01-01T00:00:00.000Z",
 *   "updated_at": "2024-01-15T10:30:00.000Z"
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Price not found
 * @return {object} 500 - Internal Server Error
 */
export const getPriceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'ID is required.' });
      return;
    }

    const price = await priceService.findById(userId, +id);

    if (!price) {
      res.status(404).json({ message: 'Price not found.' }); return;
    }

    res.status(200).json(price);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * GET /api/v1/prices/list-all
 * @summary List all prices with product names
 * @description Retrieves all prices joined with product information, returning price details with associated product names
 * @tags Prices
 * @security BearerAuth
 * @return {array<object>} 200 - List of all prices with product names
 * @example response - 200 - Success response
 * [
 *   {
 *     "id": 1,
 *     "stripePriceId": "price_1234567890",
 *     "productName": "Premium Subscription",
 *     "unitAmount": 2000,
 *     "currency": "usd",
 *     "recurringInterval": "month",
 *     "active": true
 *   },
 *   {
 *     "id": 2,
 *     "stripePriceId": "price_0987654321",
 *     "productName": "Basic Plan",
 *     "unitAmount": 1000,
 *     "currency": "usd",
 *     "recurringInterval": "month",
 *     "active": true
 *   }
 * ]
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listAllPricesWithProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const prices = await priceService.findAllWithProducts();
    res.status(200).json(prices);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};
