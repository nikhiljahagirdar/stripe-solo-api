import type { Request, Response } from 'express';
import { InvoiceItemService } from '../services/invoiceItem.service';

const invoiceItemService = new InvoiceItemService();

/**
 * Invoice item creation request.
 * @typedef {object} CreateInvoiceItemRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} customer.required - Customer ID
 * @property {integer} amount.required - Amount in cents
 * @property {string} currency.required - Three-letter ISO currency code
 * @property {string} description - Description of the item
 * @property {string} price - Price ID (alternative to amount)
 * @property {integer} quantity - Quantity of the item
 */

/**
 * Stripe invoice item object.
 * @typedef {object} StripeInvoiceItem
 * @property {string} id - Unique identifier for the invoice item
 * @property {string} customer - Customer ID
 * @property {integer} amount - Amount in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} description - Description of the item
 * @property {integer} quantity - Quantity
 * @property {number} created - Time at which the item was created
 */

/**
 * POST /api/v1/invoice-items
 * @summary Create a new invoice item
 * @description Creates an invoice item that will be added to the customer's next invoice
 * @tags Invoice Items
 * @security BearerAuth
 * @param {CreateInvoiceItemRequest} request.body.required - Invoice item creation data
 * @return {StripeInvoiceItem} 201 - Invoice item created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createInvoiceItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...itemData } = req.body;
    
    const item = await invoiceItemService.create(userId, stripeAccountId, itemData);
    res.status(201).json(item);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/invoice-items
 * @summary List all invoice items for the authenticated user
 * @description Retrieves all invoice items created by the user
 * @tags Invoice Items
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter invoice items.
 * @param {number} [year] year.query - A year to filter invoice items by creation date.
 * @return {array} 200 - List of invoice items
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getInvoiceItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const items = await invoiceItemService.findByUser(userId, accountId, year);
    res.json(items);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/invoice-items/{id}
 * @summary Retrieve a specific invoice item
 * @description Retrieves the details of an invoice item
 * @tags Invoice Items
 * @security BearerAuth
 * @param {integer} id.path.required - Invoice item ID
 * @return {StripeInvoiceItem} 200 - Invoice item details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Invoice item not found
 * @return {object} 500 - Internal Server Error
 */
export const getInvoiceItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const item = await invoiceItemService.findById(userId, id);
    if (!item) {
      res.status(404).json({ error: 'Invoice item not found' }); return;
    }
    
    res.json(item);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * PUT /api/v1/invoice-items/{id}
 * @summary Update an invoice item
 * @description Updates an existing invoice item
 * @tags Invoice Items
 * @security BearerAuth
 * @param {integer} id.path.required - Invoice item ID
 * @param {object} request.body.required - Update data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {StripeInvoiceItem} 200 - Invoice item updated successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Invoice item not found
 * @return {object} 500 - Internal Server Error
 */
export const updateInvoiceItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId, ...updateData } = req.body;
    
    const item = await invoiceItemService.update(userId, stripeAccountId, id, updateData);
    if (!item) {
      res.status(404).json({ error: 'Invoice item not found' }); return;
    }
    
    res.json(item);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * DELETE /api/v1/invoice-items/{id}
 * @summary Delete an invoice item
 * @description Deletes an invoice item that hasn't been included in an invoice yet
 * @tags Invoice Items
 * @security BearerAuth
 * @param {integer} id.path.required - Invoice item ID
 * @param {object} request.body.required - Delete data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {object} 204 - Invoice item deleted successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Invoice item not found
 * @return {object} 500 - Internal Server Error
 */
export const deleteInvoiceItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId } = req.body;
    
    const deleted = await invoiceItemService.delete(userId, stripeAccountId, id);
    if (!deleted) {
      res.status(404).json({ error: 'Invoice item not found' }); return;
    }
    
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
