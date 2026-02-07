import type { Request, Response, NextFunction } from 'express';
import { findAll } from '../services/product.service';
import type Stripe from 'stripe';
import { db } from '../db';
import { productTable, priceTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * @typedef {object} LocalProduct
 * @property {integer} id
 * @property {integer} userId
 * @property {string} stripeProductId
 * @property {string} name
 * @property {string} description
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {object} ProductListResponse
 * @property {array<LocalProduct>} data
 * @property {integer} totalCount
 * @property {integer} totalRecords
 * @property {integer} totalPages
 * @property {integer} currentPage
 * @property {integer} pageSize
 */

/**
 * @typedef {object} StripeProduct
 * @property {string} id
 * @property {string} object
 * @property {boolean} active
 * @property {string} name
 * @property {string} description
 * @property {array<string>} images
 * @property {object} metadata
 * @property {integer} created
 * @property {integer} updated
 */

/**
 * @typedef {object} StripePrice
 * @property {string} id
 * @property {string} object
 * @property {boolean} active
 * @property {string} billing_scheme
 * @property {integer} created
 * @property {string} currency
 * @property {object} recurring
 * @property {string} recurring.interval
 * @property {integer} recurring.interval_count
 * @property {string} type
 * @property {integer} unit_amount
 */

/**
 * GET /api/v1/products
 * @summary List all products
 * @description Lists all products from the local database with support for pagination, search, sorting, and filtering.
 * @tags Products
 * @param {integer} [page=1] page.query - The page number for pagination.
 * @param {integer} [pageSize=10] pageSize.query - The number of items per page.
 * @param {string} [query] query.query - A search term to filter products by name or description.
 * @param {string} [sort] sort.query - A sort string in the format 'column:direction' (e.g., 'name:asc').
 * @param {object} [filter] filter.query - A filter object (e.g., 'filter[name]=Premium Plan').
 * @param {integer} [accountId] accountId.query - An account ID to filter products.
 * @param {integer} [year] year.query - A year to filter products by creation date.
 * @param {string} [startDate] startDate.query - Filter by start date (YYYY-MM-DD).
 * @param {string} [endDate] endDate.query - Filter by end date (YYYY-MM-DD).
 * @param {string} [period] period.query - Filter by period (e.g., '7d', '30d', '90d', '1y').
 * @param {string} [name] name.query - Filter by product name.
 * @param {string} [description] description.query - Filter by product description.
 * @param {boolean} [active] active.query - Filter by active status.
 * @param {string} [priceRange] priceRange.query - Filter by price range (e.g., '1000-5000').
 * @param {string} [currency] currency.query - Filter by currency.
 * @param {string} [interval] interval.query - Filter by recurring interval.
 * @param {boolean} [hasPrice] hasPrice.query - Filter by products having a price.
 * @return {ProductListResponse} 200 - An object containing the list of products and the total count.
 */
export const listProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const { page, pageSize, query, sort, filter, startDate, endDate, period, name, description, active, priceRange, currency, interval, hasPrice, accountId, year } = req.query;
  const userId = user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const pageNum = page ? Number(page as string) : 1;
    const pageSizeNum = pageSize ? Number(pageSize as string) : 10;

    let effectiveStartDate: string | undefined = (startDate as string) || '';
    let effectiveEndDate: string | undefined = (endDate as string) || '';
    
    if (period && !startDate && !endDate) {
      const now = new Date();
      const periodMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      
      if (periodMap[period as string]!) {
        const daysAgo = new Date(now.getTime() - (periodMap[period as string]! * 24 * 60 * 60 * 1000));
        effectiveStartDate = daysAgo.toISOString().split('T')[0];
        effectiveEndDate = now.toISOString().split('T')[0];
      }
    }

    const { products, totalCount } = await findAll({
      page: pageNum,
      pageSize: pageSizeNum,
      query: query as string | undefined,
      sort: sort as string | undefined,
      filter: filter as Record<string, string> | undefined,
      userId: userId,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      name: name as string | undefined,
      description: description as string | undefined,
      active: active ? active === 'true' : undefined,
      priceRange: priceRange as string | undefined,
      currency: currency as string | undefined,
      interval: interval as string | undefined,
      hasPrice: hasPrice ? hasPrice === 'true' : undefined,
      accountId: accountId ? Number(accountId as string) : undefined,
      year: year ? Number(year as string) : undefined,
    });

    const totalPages = Math.ceil(totalCount / pageSizeNum);
    res.status(200).json({ 
      data: products, 
      totalCount, 
      totalRecords: totalCount,
      totalPages,
      currentPage: pageNum,
      pageSize: pageSizeNum
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @typedef {object} ProductWithPriceResponse
 * @property {StripeProduct} product
 * @property {StripePrice} [price]
 */

/**
 * POST /api/v1/products
 * @summary Create a new product with optional price
 * @description Creates a product in Stripe and optionally creates a default price for it
 * @tags Products
 * @security BearerAuth
 * @param {object} request.body.required - Product creation data
 * @param {integer} request.body.accountId.required - Stripe account ID
 * @param {string} request.body.name.required - Product name
 * @param {string} request.body.description - Product description
 * @param {array<string>} request.body.images - Array of image URLs
 * @param {object} request.body.defaultPriceData - Default price configuration
 * @param {integer} request.body.defaultPriceData.unit_amount - Price in cents
 * @param {string} request.body.defaultPriceData.currency - Currency code (usd, eur, etc.)
 * @param {object} request.body.defaultPriceData.recurring - Recurring billing configuration
 * @param {string} request.body.defaultPriceData.recurring.interval - Billing interval (day, week, month, year)
 * @param {integer} request.body.defaultPriceData.recurring.interval_count - Number of intervals between billings
 * @param {object} request.body.metadata - Additional metadata
 * @return {ProductWithPriceResponse} 201 - Product created successfully
 * @example response - 201 - Success response
 * {
 *   "product": {
 *     "id": "prod_1234567890",
 *     "name": "Premium Plan",
 *     "description": "Our premium subscription plan",
 *     "active": true,
 *     "created": 1635724800
 *   },
 *   "price": {
 *     "id": "price_1234567890",
 *     "unit_amount": 2999,
 *     "currency": "usd",
 *     "recurring": {
 *       "interval": "month"
 *     }
 *   }
 * }
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const createProductWithPrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { accountId, name, description, images, defaultPriceData, metadata } = req.body;
    const user = await getUserFromToken(req);
    const userId = user?.id;
    const userRole = user?.role;
  
    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized: User ID or Role not found.' }); return;
    }
  
    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required.' }); return;
    }
  
    try {
      const stripe = await getOrCreateStripeClient(accountId, userId);
      if (!stripe) {
        res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
      }
  
      const product = await stripe.products.create({
        name,
        description,
        images,
        metadata: { ...metadata, userId },
      });
  
      let price: Stripe.Price | undefined;
      if (defaultPriceData) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: defaultPriceData.unit_amount,
          currency: defaultPriceData.currency,
          recurring: defaultPriceData.recurring,
          metadata: { ...metadata, userId },
        });
      }
  
      // Store product and price details in your database
      await db.insert(productTable).values({
        userId: userId,
        stripeProductId: product.id,
        name: product.name,
        description: product.description,
      });
  
      if (price) {
        await db.insert(priceTable).values({
          userId: userId,
          stripeAccountId: Number(accountId),
          stripeProductId: product.id,
          stripePriceId: price.id,
          unitAmount: price.unit_amount ? (price.unit_amount / 100).toString() : null,
          currency: price.currency,
          recurringInterval: price.recurring?.interval,
          active: price.active,
        });
      }
  
      res.status(201).json({ product, price });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * POST /api/v1/products/{productId}/prices
   * @summary Create a price for an existing product
   * @description Creates a new price for an existing Stripe product
   * @tags Products
   * @security BearerAuth
   * @param {string} productId.path.required - Stripe product ID
   * @param {object} request.body.required - Price creation data
   * @param {integer} request.body.accountId.required - Stripe account ID
   * @param {integer} request.body.unit_amount.required - Price in cents
   * @param {string} request.body.currency.required - Currency code (usd, eur, etc.)
   * @param {object} request.body.recurring - Recurring billing configuration
   * @param {string} request.body.recurring.interval - Billing interval (day, week, month, year)
   * @param {integer} request.body.recurring.interval_count - Number of intervals between billings
   * @param {object} request.body.metadata - Additional metadata
 * @return {StripePrice} 201 - Price created successfully
   * @example response - 201 - Success response
   * {
   *   "id": "price_1234567890",
   *   "product": "prod_1234567890",
   *   "unit_amount": 2999,
   *   "currency": "usd",
   *   "active": true,
   *   "recurring": {
   *     "interval": "month",
   *     "interval_count": 1
   *   }
   * }
   * @return {object} 400 - Bad Request
   * @return {object} 401 - Unauthorized
   * @return {object} 404 - Stripe account not found
   * @return {object} 500 - Internal Server Error
   */
  export const createPriceForProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const productId = String(req.params['productId']);
    const { accountId, unit_amount, currency, recurring, metadata } = req.body;
    const user = await getUserFromToken(req);
    const userId = user?.id;
    const userRole = user?.role;
  
    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized: User ID or Role not found.' }); return;
    }
  
    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required.' }); return;
    }
  
    try {
      const stripe = await getOrCreateStripeClient(accountId, userId);
      if (!stripe) {
        res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
      }
  
      const price = await stripe.prices.create({
        product: productId,
        unit_amount,
        currency,
        recurring,
        metadata: { ...metadata, userId },
      });
  
      await db.insert(priceTable).values({
        userId: userId,
        stripeAccountId: Number(accountId),
        stripeProductId: productId,
        stripePriceId: price.id,
        unitAmount: price.unit_amount ? (price.unit_amount / 100).toString() : null,
        currency: price.currency,
        recurringInterval: price.recurring?.interval,
        active: price.active,
      });
  
      res.status(201).json(price);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * PUT /api/v1/products/{productId}
   * @summary Update an existing product
   * @description Updates a Stripe product's details
   * @tags Products
   * @security BearerAuth
   * @param {string} productId.path.required - Stripe product ID
   * @param {object} request.body.required - Product update data
   * @param {integer} request.body.accountId.required - Stripe account ID
   * @param {string} request.body.name - Updated product name
   * @param {string} request.body.description - Updated product description
   * @param {array<string>} request.body.images - Updated array of image URLs
   * @param {object} request.body.metadata - Updated metadata
 * @return {StripeProduct} 200 - Product updated successfully
   * @return {object} 400 - Bad Request
   * @return {object} 401 - Unauthorized
   * @return {object} 404 - Product or Stripe account not found
   * @return {object} 500 - Internal Server Error
   */
  export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const productId = String(req.params['productId']);
    const { accountId, name, description, images, metadata } = req.body;
    const user = await getUserFromToken(req);
    const userId = user?.id;
    const userRole = user?.role;
  
    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized: User ID or Role not found.' }); return;
    }
  
    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required.' }); return;
    }
  
    try {
      const stripe = await getOrCreateStripeClient(accountId, userId);
      if (!stripe) {
        res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
      }
  
      const updatedProduct = await stripe.products.update(productId, {
        name,
        description,
        images,
        metadata: { ...metadata, userId },
      });
  
      await db.update(productTable)
        .set({ name: updatedProduct.name, description: updatedProduct.description })
        .where(eq(productTable.stripeProductId, productId));
  
      res.status(200).json(updatedProduct);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * PUT /api/v1/products/prices/{priceId}
   * @summary Update a price
   * @description Updates a Stripe price's status and metadata
   * @tags Products
   * @security BearerAuth
   * @param {string} priceId.path.required - Stripe price ID
   * @param {object} request.body.required - Price update data
   * @param {integer} request.body.accountId.required - Stripe account ID
   * @param {boolean} request.body.active - Whether the price is active
   * @param {object} request.body.metadata - Additional metadata
 * @return {StripePrice} 200 - Price updated successfully
   * @return {object} 400 - Bad Request
   * @return {object} 401 - Unauthorized
   * @return {object} 404 - Price or Stripe account not found
   * @return {object} 500 - Internal Server Error
   */
  export const updatePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const priceId = String(req.params['priceId']);
    const { accountId, active, metadata } = req.body;
    const user = await getUserFromToken(req);
    const userId = user?.id;
    const userRole = user?.role;
  
    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized: User ID or Role not found.' }); return;
    }
  
    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required.' }); return;
    }
  
    try {
      const stripe = await getOrCreateStripeClient(accountId, userId);
      if (!stripe) {
        res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
      }
  
      const updatedPrice = await stripe.prices.update(priceId, {
        active,
        metadata: { ...metadata, userId },
      });
  
      await db.update(priceTable)
        .set({ active: updatedPrice.active })
        .where(eq(priceTable.stripePriceId, priceId));
  
      res.status(200).json(updatedPrice);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * @typedef {object} ProductInsightsResponse
   * @property {integer} totalProducts
   * @property {integer} activeProducts
   * @property {integer} totalPrices
   */

  /**
   * GET /api/v1/products/insights/{accountId}
   * @summary Get product insights
   * @description Retrieves insights about products and prices for a specific account
   * @tags Products
   * @security BearerAuth
 * @param {integer} accountId.path.required - Stripe account ID
   * @return {ProductInsightsResponse} 200 - Product insights
   * @example response - 200 - Success response
   * {
   *   "totalProducts": 50,
   *   "activeProducts": 45,
   *   "totalPrices": 60
   * }
   * @return {object} 400 - Bad Request
   * @return {object} 401 - Unauthorized
   * @return {object} 404 - Stripe account not found
   * @return {object} 500 - Internal Server Error
   */
  export const getProductInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const accountId = String(req.params['accountId']);
    const user = await getUserFromToken(req);
    const userId = user?.id;
    const userRole = user?.role;
  
    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
    }
  
    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required.' }); return;
    }
  
    try {
      const stripe = await getOrCreateStripeClient(accountId, userId);
      if (!stripe) {
        res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
      }
  
      const products = await stripe.products.list({ limit: 100, active: true });
      const prices = await stripe.prices.list({ limit: 100, active: true });
  
      res.status(200).json({
          totalProducts: products.data.length,
          activeProducts: products.data.filter(p => p.active).length,
          totalPrices: prices.data.length,
      });
    } catch (error) {
      next(error);
    }
  };
