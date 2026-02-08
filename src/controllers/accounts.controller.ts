import type { Request, Response, NextFunction } from 'express';
import { syncStripeAccount, listAccountsByUserId, getAccountById, deleteAccount, getAccountsByKeyId } from '../services/account.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Stripe account sync request object.
 * @typedef {object} SyncAccountRequest
 * @property {integer} stripeKeyId.required - The ID of the Stripe API key to use for syncing
 */

/**
 * Stripe account object.
 * @typedef {object} StripeAccount
 * @property {integer} id - Account database ID
 * @property {integer} userId - User ID who owns the account
 * @property {string} stripeAccountId - Stripe account identifier
 * @property {string} accountName - Display name for the account
 * @property {string} email - Email associated with the account
 * @property {string} country - Two-letter country code
 * @property {string} currency - Default currency for the account
 * @property {boolean} chargesEnabled - Whether charges are enabled
 * @property {boolean} payoutsEnabled - Whether payouts are enabled
 * @property {string} type - Account type (standard, express, custom)
 * @property {string} created_at - Account creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * POST /api/v1/accounts/sync
 * @summary Sync a Stripe account to local database
 * @description Syncs a Stripe account using the provided API key and stores account details locally
 * @tags Accounts
 * @security BearerAuth
 * @param {SyncAccountRequest} request.body.required - Stripe API key information
 * @return {object} 200 - Account synced successfully
 * @example response - 200 - Success response
 * {
 *   "message": "Account synced successfully",
 *   "account": {
 *     "id": 1,
 *     "stripeAccountId": "acct_1234567890",
 *     "accountName": "My Business Account",
 *     "email": "business@example.com",
 *     "chargesEnabled": true,
 *     "payoutsEnabled": true
 *   }
 * }
 * @return {object} 400 - Bad Request - Missing required fields
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const syncAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { stripeKeyId } = req.body;
        const user = await getUserFromToken(req);
        
        if (!user?.id) {
            res.status(401).json({ message: 'Unauthorized' }); return;
        }

        const syncResult = await syncStripeAccount(user.id, stripeKeyId);
        res.status(200).json(syncResult);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/accounts/{accountId}
 * @summary Retrieve a specific Stripe account
 * @description Gets detailed information about a specific Stripe account owned by the authenticated user
 * @tags Accounts
 * @security BearerAuth
 * @param {integer} accountId.path.required - Account database ID
 * @return {StripeAccount} 200 - Account details retrieved successfully
 * @example response - 200 - Success response
 * {
 *   "id": 1,
 *   "userId": 123,
 *   "stripeAccountId": "acct_1234567890",
 *   "accountName": "My Business Account",
 *   "email": "business@example.com",
 *   "country": "US",
 *   "currency": "usd",
 *   "chargesEnabled": true,
 *   "payoutsEnabled": true,
 *   "type": "express",
 *   "created_at": "2024-01-01T00:00:00.000Z",
 *   "updated_at": "2024-01-15T12:30:00.000Z"
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Account not found
 * @return {object} 500 - Internal Server Error
 */
export const getAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await getUserFromToken(req);
        
        if (!user?.id) {
            res.status(401).json({ message: 'Unauthorized' }); return;
        }

        const accountId = Number(req.params['accountId']);
        const account = await getAccountById(user.id, accountId);

        if (!account) {
            res.status(404).json({ message: 'Account not found' }); return;
        }

        res.status(200).json(account);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/accounts/{accountId}
 * @summary Delete a Stripe account from local database
 * @description Removes a Stripe account from the local database (does not affect the account in Stripe)
 * @tags Accounts
 * @security BearerAuth
 * @param {integer} accountId.path.required - Account database ID to delete
 * @return {object} 200 - Account deleted successfully
 * @example response - 200 - Success response
 * {
 *   "message": "Account deleted successfully"
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Account not found
 * @return {object} 500 - Internal Server Error
 */
export const removeAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await getUserFromToken(req);
        
        if (!user?.id) {
            res.status(401).json({ message: 'Unauthorized' }); return;
        }

        const accountId = Number(req.params['accountId']);
        await deleteAccount(user.id, accountId);

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/accounts
 * @summary List all Stripe accounts for the authenticated user
 * @description Retrieves a list of all Stripe accounts associated with the authenticated user
 * @tags Accounts
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - Filter by specific account ID
 * @param {integer} [year] year.query - Filter accounts by creation year
 * @return {object} 200 - List of accounts retrieved successfully
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "userId": 123,
 *       "stripeAccountId": "acct_1234567890",
 *       "accountName": "My Business Account",
 *       "email": "business@example.com",
 *       "country": "US",
 *       "currency": "usd",
 *       "chargesEnabled": true,
 *       "payoutsEnabled": true,
 *       "type": "express",
 *       "created_at": "2024-01-01T00:00:00.000Z"
 *     },
 *     {
 *       "id": 2,
 *       "stripeAccountId": "acct_0987654321",
 *       "accountName": "Second Account",
 *       "chargesEnabled": true,
 *       "payoutsEnabled": false
 *     }
 *   ]
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        
        const user = await getUserFromToken(req);
        
        if (!user?.id) {
            res.status(401).json({ message: 'Unauthorized' }); return;
        }
        const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
        const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;

        const accounts = await listAccountsByUserId(user.id, accountId, year);
        res.status(200).json({ data: accounts });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/accounts/by-key/{keyId}
 * @summary Get accounts associated with a specific Stripe key
 * @description Retrieves all Stripe accounts linked to a specific API key
 * @tags Accounts
 * @security BearerAuth
 * @param {integer} keyId.path.required - The Stripe key ID
 * @return {object} 200 - List of accounts retrieved successfully
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "userId": 123,
 *       "stripe_key_id": 5,
 *       "stripeAccountId": "acct_1234567890",
 *       "displayName": "My Business Account",
 *       "email": "business@example.com",
 *       "country": "US",
 *       "defaultCurrency": "usd",
 *       "chargesEnabled": true,
 *       "payoutsEnabled": true,
 *       "type": "express"
 *     }
 *   ]
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const getAccountsByKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await getUserFromToken(req);
        
        if (!user?.id) {
            res.status(401).json({ message: 'Unauthorized' }); return;
        }

        const keyId = Number(req.params['keyId']);

        if (!keyId || Number.isNaN(keyId)) {
            res.status(400).json({ message: 'Invalid key ID' }); return;
        }

        const accounts = await getAccountsByKeyId(user.id, keyId);
        res.status(200).json({ data: accounts });
    } catch (error) {
        next(error);
    }
};