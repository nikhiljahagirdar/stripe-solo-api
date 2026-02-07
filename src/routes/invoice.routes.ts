import { Router } from 'express';
import { listInvoices,  retrieveInvoice, updateInvoice } from '../controllers/invoice.controller';

const router = Router();


/**
 * GET /api/v1/invoices
 * @summary List all invoices with search and pagination
 * @tags Invoices
 * @security BearerAuth
 * @param {integer} page.query - Page number for pagination
 * @param {integer} pageSize.query - Number of items per page
 * @param {string} query.query - Search term for filtering by status or currency
 * @param {string} sort.query - Sort field and direction (e.g., amount:desc)
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} status.query - Invoice status filter
 * @param {string} currency.query - Currency filter
 * @param {string} customerName.query - Filter by customer name
 * @param {integer} [accountId] accountId.query - An account ID to filter invoices.
 * @param {integer} [year] year.query - A year to filter invoices by creation date.
 * @return {object} 200 - List of invoices with pagination
 * @return {object} 401 - Unauthorized
 */
router.get('/', listInvoices);



/**
 * GET /api/v1/invoices/{invoiceId}
 * @summary Retrieve an invoice
 * @tags Invoices
 * @security BearerAuth
 */
router.get('/:invoiceId', retrieveInvoice);

/**
 * PUT /api/v1/invoices/{invoiceId}
 * @summary Update an invoice
 * @tags Invoices
 * @security BearerAuth
 */
router.put('/:invoiceId', updateInvoice);

export default router;