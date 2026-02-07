import { Router } from 'express';
import {
  createCustomer,
  retrieveCustomer,
  updateCustomer,
  listCustomers,
  getCustomerInsights,
} from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Use authenticate middleware for all customer routes to ensure user is logged in
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The database ID of the customer.
 *         userId:
 *           type: integer
 *           description: The ID of the user who owns this customer record.
 *         stripeAccountId:
 *           type: integer
 *           description: The database ID of the Stripe account this customer belongs to.
 *         stripeCustomerId:
 *           type: string
 *           description: The Stripe Customer ID (e.g., 'cus_...').
 *         email:
 *           type: string
 *           nullable: true
 *           description: The customer's email address.
 *         name:
 *           type: string
 *           nullable: true
 *           description: The customer's name.
 *     UpdateCustomer:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: The customer's email address.
 *         name:
 *           type: string
 *           description: The customer's full name.
 */

/**
 * POST /api/v1/customers
 * @summary Create a new customer
 * @tags Customers
 * @param {object} request.body.required - Customer data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @param {string} request.body.email - Customer email address
 * @param {string} request.body.name - Customer full name
 * @param {string} request.body.description - Customer description
 * @param {object} request.body.address - Customer address
 * @param {string} request.body.phone - Customer phone number
 * @example request - Request body example
 *   {
 *     "stripeAccountId": 1,
 *     "email": "customer@example.com",
 *     "name": "John Doe",
 *     "description": "Premium customer",
 *     "phone": "+1234567890"
 *   }
 * @return {object} 201 - Customer created successfully
 * @example response - 201 - Success response
 *   {
 *     "id": 1,
 *     "userId": 1,
 *     "stripeAccountId": 1,
 *     "stripeCustomerId": "cus_1234567890",
 *     "email": "customer@example.com",
 *     "name": "John Doe"
 *   }
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.post('/', createCustomer);

/**
 * GET /api/v1/customers
 * @summary List all customers with advanced filtering and pagination
 * @description Retrieves a paginated list of customers from the local database with comprehensive filtering, search, and sorting capabilities
 * @tags Customers
 * @security BearerAuth
 * @param {integer} [page=1] page.query - Page number for pagination (minimum: 1)
 * @param {integer} [pageSize=10] pageSize.query - Number of items per page (minimum: 1, maximum: 100)
 * @param {integer} [accountId] accountId.query - Filter customers by Stripe Account ID
 * @param {string} [query] query.query - Search term to filter customers by name or email (case-insensitive partial match)
 * @param {string} [sort=id:desc] sort.query - Sort field and direction. Format: field:direction. Available fields: id, name, email, created, createdAt. Directions: asc, desc
 * @param {string} [startDate] startDate.query - Filter customers created after this date (YYYY-MM-DD format)
 * @param {string} [endDate] endDate.query - Filter customers created before this date (YYYY-MM-DD format)
 * @param {string} [period] period.query - Predefined time period filter (7d, 30d, 90d, 1y, custom). When 'custom' is used, startDate and endDate are required
 * @param {integer} [year] year.query - Filter customers created in specific year (e.g., 2024)
 * @param {string} [email] email.query - Filter by exact email address
 * @param {string} [name] name.query - Filter by exact customer name
 * @param {boolean} [liveMode] liveMode.query - Filter by live mode status (true for live, false for test)
 * @return {object} 200 - Paginated list of customers with payment statistics
 * @example response - 200 - Success response with customer data and pagination
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "userId": 123,
 *       "stripeAccountId": 1,
 *       "stripeCustomerId": "cus_1234567890",
 *       "email": "customer@example.com",
 *       "name": "John Doe",
 *       "liveMode": true,
 *       "created": 1640995200,
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "updatedAt": "2024-01-01T00:00:00.000Z"
 *     }
 *   ],
 *   "total": 150,
 *   "page": 1,
 *   "pageSize": 10,
 *   "totalPages": 15
 * }
 * @return {object} 400 - Bad Request - Invalid parameters
 * @return {object} 401 - Unauthorized - Authentication required
 * @return {object} 500 - Internal Server Error
 */
router.get('/', listCustomers);

/**
 * GET /api/v1/customers/{customerId}
 * @summary Retrieve a single customer
 * @tags Customers
 * @param {integer} customerId.path.required - Customer ID
 * @return {object} 200 - Customer details
 * @example response - 200 - Success response
 *   {
 *     "id": 1,
 *     "userId": 1,
 *     "stripeAccountId": 1,
 *     "stripeCustomerId": "cus_1234567890",
 *     "email": "customer@example.com",
 *     "name": "John Doe"
 *   }
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Customer not found
 */
router.get('/:customerId', retrieveCustomer);

/**
 * PUT /api/v1/customers/{customerId}
 * @summary Update a customer
 * @tags Customers
 * @param {integer} customerId.path.required - Customer ID
 * @param {object} request.body.required - Update data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @param {string} request.body.email - Updated email
 * @param {string} request.body.name - Updated name
 * @param {string} request.body.description - Updated description
 * @example request - Request body example
 *   {
 *     "stripeAccountId": 1,
 *     "email": "newemail@example.com",
 *     "name": "Jane Doe"
 *   }
 * @return {object} 200 - Customer updated successfully
 * @example response - 200 - Success response
 *   {
 *     "id": 1,
 *     "userId": 1,
 *     "stripeAccountId": 1,
 *     "stripeCustomerId": "cus_1234567890",
 *     "email": "newemail@example.com",
 *     "name": "Jane Doe"
 *   }
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Customer not found
 */
router.put('/:customerId', updateCustomer);

/**
 * GET /api/v1/customers/{customerId}/insights
 * @summary Get financial insights for a customer
 * @tags Customers
 * @param {string} customerId.path.required - Stripe customer ID
 * @param {integer} stripeAccountId.query.required - Stripe account ID
 * @return {object} 200 - Customer insights data
 * @example response - 200 - Success response
 *   {
 *     "customerId": "cus_1234567890",
 *     "lastPayment": {
 *       "id": "pi_1234567890",
 *       "amount": 2000,
 *       "currency": "usd",
 *       "status": "succeeded"
 *     },
 *     "subscriptions": [],
 *     "ltv": "N/A",
 *     "segments": "N/A",
 *     "churnRisk": "N/A"
 *   }
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden
 * @return {object} 404 - Customer not found
 */
router.get('/:customerId/insights', getCustomerInsights);

export default router;