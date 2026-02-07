import type { Request, Response } from 'express';
import { QuoteService } from '../services/quote.service';

const quoteService = new QuoteService();

/**
 * Quote creation request.
 * @typedef {object} CreateQuoteRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} customer.required - Customer ID
 * @property {array<object>} line_items.required - Array of line items
 * @property {string} description - Description of the quote
 * @property {object} metadata - Set of key-value pairs
 */

/**
 * Stripe quote object.
 * @typedef {object} StripeQuote
 * @property {string} id - Unique identifier for the quote
 * @property {string} status - Status of the quote (draft, open, accepted, canceled)
 * @property {string} customer - Customer ID
 * @property {array<object>} line_items - Line items for the quote
 * @property {integer} amount_total - Total amount for the quote
 * @property {string} currency - Three-letter ISO currency code
 * @property {number} created - Time at which the quote was created
 */

/**
 * POST /api/v1/quotes
 * @summary Create a new quote
 * @description Creates a quote for a customer with specified line items
 * @tags Quotes
 * @security BearerAuth
 * @param {CreateQuoteRequest} request.body.required - Quote creation data
 * @return {StripeQuote} 201 - Quote created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...quoteData } = req.body;
    
    const quote = await quoteService.create(userId, stripeAccountId, quoteData);
    res.status(201).json(quote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/quotes
 * @summary List all quotes for the authenticated user
 * @description Retrieves all quotes created by the user
 * @tags Quotes
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter quotes.
 * @param {number} [year] year.query - A year to filter quotes by creation date.
 * @return {array<object>} 200 - List of quotes
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getQuotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const quotes = await quoteService.findByUser(userId, accountId, year);
    res.json(quotes);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/quotes/{id}
 * @summary Retrieve a specific quote
 * @description Retrieves the details of a quote
 * @tags Quotes
 * @security BearerAuth
 * @param {integer} id.path.required - Quote ID
 * @return {StripeQuote} 200 - Quote details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Quote not found
 * @return {object} 500 - Internal Server Error
 */
export const getQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const quote = await quoteService.findById(userId, id);
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' }); return;
    }
    
    res.json(quote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/quotes/{id}/finalize
 * @summary Finalize a quote
 * @description Finalizes a quote, making it ready for acceptance
 * @tags Quotes
 * @security BearerAuth
 * @param {integer} id.path.required - Quote ID
 * @param {object} request.body.required - Finalize data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {StripeQuote} 200 - Quote finalized successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Quote not found
 * @return {object} 500 - Internal Server Error
 */
export const finalizeQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId } = req.body;
    
    const quote = await quoteService.finalize(userId, stripeAccountId, id);
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' }); return;
    }
    
    res.json(quote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/quotes/{id}/accept
 * @summary Accept a quote
 * @description Accepts a finalized quote, creating an invoice
 * @tags Quotes
 * @security BearerAuth
 * @param {integer} id.path.required - Quote ID
 * @param {object} request.body.required - Accept data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {StripeQuote} 200 - Quote accepted successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Quote not found
 * @return {object} 500 - Internal Server Error
 */
export const acceptQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId } = req.body;
    
    const quote = await quoteService.accept(userId, stripeAccountId, id);
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' }); return;
    }
    
    res.json(quote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/quotes/{id}/cancel
 * @summary Cancel a quote
 * @description Cancels a quote, preventing it from being accepted
 * @tags Quotes
 * @security BearerAuth
 * @param {integer} id.path.required - Quote ID
 * @param {object} request.body.required - Cancel data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {StripeQuote} 200 - Quote canceled successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Quote not found
 * @return {object} 500 - Internal Server Error
 */
export const cancelQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId } = req.body;
    
    const quote = await quoteService.cancel(userId, stripeAccountId, id);
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' }); return;
    }
    
    res.json(quote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
