import { Router } from 'express';
import { listBalanceAndAccount } from '../controllers/balance.controller';

const router = Router();

/**
 * GET /balance/{accountId}
 * @summary Get balance and a paginated list of balance transactions for a specific account
 * @tags Balance
 * @param {integer} accountId.path.required - The internal ID of the Stripe account.
 * @param {integer} page.query - Page number for transaction pagination.
 * @param {integer} pageSize.query - Number of transactions per page.
 * @return {object} 200 - Success response with balance and transactions.
 * @return {object} 401 - Unauthorized.
 * @return {object} 404 - Account not found.
 */
router.get('/:accountId',  listBalanceAndAccount);

export default router;