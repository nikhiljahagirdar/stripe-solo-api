import type { Request, Response } from 'express';
import { CreditNoteService } from '../services/creditNote.service';

const creditNoteService = new CreditNoteService();

/**
 * Credit note creation request.
 * @typedef {object} CreateCreditNoteRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} invoice.required - Invoice ID to credit
 * @property {integer} amount - Amount to credit in cents
 * @property {string} reason - Reason for the credit note
 * @property {array} lines - Line items for the credit note
 * @property {object} metadata - Set of key-value pairs
 */

/**
 * Stripe credit note object.
 * @typedef {object} StripeCreditNote
 * @property {string} id - Unique identifier for the credit note
 * @property {string} status - Status of the credit note
 * @property {string} invoice - Invoice ID this credit note applies to
 * @property {integer} amount - Amount of the credit note in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} reason - Reason for the credit note
 * @property {number} created - Time at which the credit note was created
 */

/**
 * POST /api/v1/credit-notes
 * @summary Create a new credit note
 * @description Creates a credit note to refund or credit an invoice
 * @tags Credit Notes
 * @security BearerAuth
 * @param {CreateCreditNoteRequest} request.body.required - Credit note creation data
 * @return {StripeCreditNote} 201 - Credit note created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createCreditNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...creditNoteData } = req.body;
    
    const creditNote = await creditNoteService.create(userId, stripeAccountId, creditNoteData);
    res.status(201).json(creditNote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/credit-notes
 * @summary List all credit notes for the authenticated user
 * @description Retrieves all credit notes created by the user
 * @tags Credit Notes
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter credit notes.
 * @param {number} [year] year.query - A year to filter credit notes by creation date.
 * @return {array} 200 - List of credit notes
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getCreditNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const creditNotes = await creditNoteService.findByUser(userId, accountId, year);
    res.json(creditNotes);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/credit-notes/{id}
 * @summary Retrieve a specific credit note
 * @description Retrieves the details of a credit note
 * @tags Credit Notes
 * @security BearerAuth
 * @param {integer} id.path.required - Credit note ID
 * @return {StripeCreditNote} 200 - Credit note details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Credit note not found
 * @return {object} 500 - Internal Server Error
 */
export const getCreditNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const creditNote = await creditNoteService.findById(userId, id);
    if (!creditNote) {
      res.status(404).json({ error: 'Credit note not found' }); return;
    }
    
    res.json(creditNote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/credit-notes/{id}/void
 * @summary Void a credit note
 * @description Voids a credit note, preventing it from being applied
 * @tags Credit Notes
 * @security BearerAuth
 * @param {integer} id.path.required - Credit note ID
 * @param {object} request.body.required - Void data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {StripeCreditNote} 200 - Credit note voided successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Credit note not found
 * @return {object} 500 - Internal Server Error
 */
export const voidCreditNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId } = req.body;
    
    const creditNote = await creditNoteService.voidCreditNote(userId, stripeAccountId, id);
    if (!creditNote) {
      res.status(404).json({ error: 'Credit note not found' }); return;
    }
    
    res.json(creditNote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
