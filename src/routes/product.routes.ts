import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  listProducts,
  createProductWithPrice,
  createPriceForProduct,
  updateProduct,
  updatePrice,
  getProductInsights,
} from '../controllers/product.controller';

const router = Router();

/**
 * GET /products
 * @summary List all products with prices and advanced filtering
 * @tags Products
 * @param {integer} page.query - Page number for pagination
 * @param {integer} pageSize.query - Number of items per page
 * @param {string} query.query - Search term for product name or description
 * @param {string} sort.query - Sort field and direction (e.g., name:asc, createdAt:desc)
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} name.query - Filter by product name
 * @param {string} description.query - Filter by product description
 * @param {boolean} active.query - Filter by active status
 * @param {string} priceRange.query - Filter by price range (e.g., 1000-5000)
 * @param {string} currency.query - Filter by price currency
 * @param {string} interval.query - Filter by recurring interval (day, week, month, year)
 * @param {boolean} hasPrice.query - Filter products that have prices
 * @param {integer} [accountId] accountId.query - An account ID to filter products.
 * @param {integer} [year] year.query - A year to filter products by creation date.
 * @return {object} 200 - List of products with prices and pagination
 * @return {object} 401 - Unauthorized
 */
router.get('/', authenticate, listProducts);

/**
 * POST /products
 * @summary Create a new Stripe Product, optionally with a default Price
 * @tags Products
 * @param {object} request.body.required - Request data
 * @return {object} 201 - Created successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.post('/', authenticate, createProductWithPrice);

/**
 * POST /products/{productId}/prices
 * @summary Create a price for an existing product
 * @tags Products
 * @param {object} request.body.required - Request data
 * @return {object} 201 - Created successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.post('/:productId/prices', authenticate, createPriceForProduct);

/**
 * PUT /products/{productId}
 * @summary Update an existing product
 * @tags Products
 * @param {object} request.body.required - Update data
 * @return {object} 200 - Updated successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.put('/:productId', authenticate, updateProduct);

/**
 * PUT /products/prices/{priceId}
 * @summary Update an existing price
 * @tags Products
 * @param {object} request.body.required - Update data
 * @return {object} 200 - Updated successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.put('/prices/:priceId', authenticate, updatePrice);

/**
 * GET /products/{accountId}/insights
 * @summary Get product insights for a Stripe account
 * @tags Products
 * @return {object} 200 - Success response
 * @return {object} 401 - Unauthorized
 */
router.get('/:accountId/insights', authenticate, getProductInsights);

export default router;
