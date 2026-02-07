import type { Request, Response } from 'express';
import { BalanceTransactionService } from '../services/balanceTransaction.service';

const balanceTransactionService = new BalanceTransactionService();

/**
 * Balance transaction sync request.
 * @typedef {object} SyncBalanceTransactionRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} stripeTransactionId.required - Stripe transaction ID to sync
 */

/**
 * GET /api/v1/balance-transactions
 * @summary List all balance transactions for the authenticated user
 * @description Retrieves all balance transactions from the user's Stripe accounts
 * @tags Balance Transactions
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter balance transaction.
 * @param {number} [year] year.query - A year to filter balance transaction by creation date.
 * @return {array} 200 - List of balance transactions
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getBalanceTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const transactions = await balanceTransactionService.findByUser(userId, accountId, year);
    res.json(transactions);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/balance-transactions/{id}
 * @summary Retrieve a specific balance transaction
 * @description Retrieves the details of a balance transaction
 * @tags Balance Transactions
 * @security BearerAuth
 * @param {integer} id.path.required - Balance transaction ID
 * @return {object} 200 - Balance transaction details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Balance transaction not found
 * @return {object} 500 - Internal Server Error
 */
export const getBalanceTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const transaction = await balanceTransactionService.findById(userId, id);
    if (!transaction) {
      res.status(404).json({ error: 'Balance transaction not found' }); return;
    }
    
    res.json(transaction);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/balance-transactions/sync
 * @summary Sync a balance transaction from Stripe
 * @description Retrieves a balance transaction from Stripe and creates or updates it in the local database
 * @tags Balance Transactions
 * @security BearerAuth
 * @param {SyncBalanceTransactionRequest} request.body.required - Transaction sync data
 * @return {object} 200 - Balance transaction synced successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const syncBalanceTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, stripeTransactionId } = req.body;
    
    const transaction = await balanceTransactionService.syncFromStripe(userId, stripeAccountId, stripeTransactionId);
    res.json(transaction);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
