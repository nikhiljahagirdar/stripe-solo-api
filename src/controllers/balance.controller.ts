import type { Request, Response } from 'express';
import { getBalanceAndAccount } from '../services/balance.service';
import { getUserFromToken } from '../utils/auth.utils';
import { getEffectiveUserId } from '../utils/user.utils';
import logger from '../utils/logger';

/**
 * Balance and account response object.
 * @typedef {object} BalanceAndAccountResponse
 * @property {object} balance - Balance information
 * @property {array<object>} balance.available - Available balance amounts
 * @property {number} balance.available[].amount - Available amount in cents
 * @property {string} balance.available[].currency - Currency code
 * @property {array<object>} balance.pending - Pending balance amounts
 * @property {number} balance.pending[].amount - Pending amount in cents
 * @property {string} balance.pending[].currency - Currency code
 * @property {object} account - Stripe account information
 * @property {string} account.id - Stripe account ID
 * @property {string} account.email - Account email
 * @property {string} account.country - Two-letter country code
 * @property {string} account.default_currency - Default currency
 * @property {boolean} account.charges_enabled - Whether charges are enabled
 * @property {boolean} account.payouts_enabled - Whether payouts are enabled
 */

/**
 * GET /api/v1/balance/{accountId}
 * @summary Get balance and account details
 * @description Retrieves the current balance information and account details for a specific Stripe account
 * @tags Balance
 * @security BearerAuth
 * @param {integer} accountId.path.required - Stripe account database ID
 * @return {BalanceAndAccountResponse} 200 - Balance and account information retrieved successfully
 * @example response - 200 - Success response
 * {
 *   "balance": {
 *     "available": [
 *       {
 *         "amount": 150000,
 *         "currency": "usd"
 *       }
 *     ],
 *     "pending": [
 *       {
 *         "amount": 25000,
 *         "currency": "usd"
 *       }
 *     ]
 *   },
 *   "account": {
 *     "id": "acct_1234567890",
 *     "email": "business@example.com",
 *     "country": "US",
 *     "default_currency": "usd",
 *     "charges_enabled": true,
 *     "payouts_enabled": true
 *   }
 * }
 * @return {object} 400 - Bad Request - Invalid account ID
 * @example response - 400 - Invalid account ID
 * {
 *   "error": "Invalid account ID."
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @example response - 401 - Unauthorized
 * {
 *   "error": "Unauthorized"
 * }
 * @return {object} 404 - Not Found - Balance information not found
 * @example response - 404 - Not found
 * {
 *   "error": "Balance information not found for this account."
 * }
 * @return {object} 500 - Internal Server Error
 */
export const listBalanceAndAccount = async (req: Request, res: Response): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

  const accountId = +req.params['accountId']!;
  if (Number.isNaN(accountId)) {
    res.status(400).json({ error: 'Invalid account ID.' }); return;
  }

  const effectiveUserId = await getEffectiveUserId(req);
  if (!effectiveUserId) {
    res.status(401).json({ error: 'Unable to determine effective user ID.' }); return;
  }

  try {
    const result = await getBalanceAndAccount(accountId, effectiveUserId);

    if (!result) {
      res.status(404).json({ error: 'Balance information not found for this account.' });
      return;
    }

    res.status(200).json({
      balance: {
        available: [{
          amount: result.balance.available,
          currency: result.balance.currency,
        }],
        pending: [{
          amount: result.balance.pending,
          currency: result.balance.currency,
        }],
      },
      account: result.account,
    });
  } catch (error) {
    logger.error('Error fetching balance and account:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
