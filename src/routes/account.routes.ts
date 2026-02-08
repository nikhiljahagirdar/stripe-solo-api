import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listAccounts, getAccount,removeAccount,syncAccounts, getAccountsByKey} from '../controllers/accounts.controller';
import { listBalanceAndAccount } from '../controllers/balance.controller';

const router = Router();

/**
 * GET /api/v1/accounts
 * @summary List all Stripe accounts for the authenticated user
 * @tags Accounts
 * @return {array<object>} 200 - An array of Stripe account objects.
 * @return {object} 401 - Unauthorized.
 */
router.get('/', authenticate, listAccounts);

/**
 * GET /api/v1/accounts/by-key/{keyId}
 * @summary Get accounts by Stripe key ID
 * @tags Accounts
 * @param {integer} keyId.path.required - The Stripe key ID
 * @return {object} 200 - Array of Stripe account objects
 * @return {object} 400 - Invalid key ID
 * @return {object} 401 - Unauthorized
 */
router.get('/by-key/:keyId', authenticate, getAccountsByKey);

/**
 * GET /api/v1/accounts/{accountId}
 * @summary Get a specific Stripe account
 * @tags Accounts
 * @param {string} accountId.path.required - The account ID
 * @return {object} 200 - Stripe account object
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Account not found
 */
router.get('/:accountId', authenticate, getAccount);

/**
 * DELETE   /api/v1/accounts/{accountId}
 * @summary Remove a Stripe account
 * @tags Accounts
 * @param {string} accountId.path.required - The account ID
 * @return {object} 200 - Account removed successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Account not found
 */
router.delete('/:accountId', authenticate, removeAccount);

/**
 * POST /api/v1/accounts/sync
 * @summary Sync Stripe accounts
 * @tags Accounts
 * @return {object} 200 - Accounts synced successfully
 * @return {object} 401 - Unauthorized
 */
router.post('/sync', authenticate, syncAccounts);

/**
 * GET /api/v1/accounts/{accountId}/balance
 * @summary Get balance and transactions for a specific account
 * @tags Accounts
 * @param {integer} accountId.path.required - The internal ID of the Stripe account
 * @param {integer} page.query - Page number for pagination
 * @param {integer} pageSize.query - Number of items per page
 * @return {object} 200 - Balance and transactions data
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Account not found
 */
router.get('/:accountId/balance', authenticate, listBalanceAndAccount);

export default router;
