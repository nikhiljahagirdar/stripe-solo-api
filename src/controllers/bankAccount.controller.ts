import type { Request, Response, NextFunction } from 'express';
import { findAll, create } from '../services/bankAccount.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Bank account creation request.
 * @typedef {object} CreateBankAccountRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {string} customerId.required - Customer ID to attach bank account to
 * @property {string} accountNumber.required - Bank account number
 * @property {string} routingNumber.required - Bank routing number
 * @property {string} country.required - Two-letter country code
 * @property {string} currency.required - Three-letter ISO currency code
 */

/**
 * Stripe bank account object.
 * @typedef {object} StripeBankAccount
 * @property {string} id - Unique identifier for the bank account
 * @property {string} last4 - Last 4 digits of the account number
 * @property {string} routing_number - Bank routing number
 * @property {string} country - Two-letter country code
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} status - Status of the bank account
 * @property {string} bank_name - Name of the bank
 */

/**
 * GET /api/v1/bank-accounts
 * @summary List all bank accounts for the authenticated user
 * @description Retrieves all bank accounts associated with the user's customers
 * @tags Bank Accounts
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter bank accounts.
 * @param {number} [year] year.query - A year to filter bank accounts by creation date (e.g., 2024).
 * @param {number} [month] month.query - A month (1-12) to filter bank accounts. If omitted, filters entire year.
 * @return {array} 200 - List of bank accounts
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const listBankAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const bankAccounts = await findAll(user.id, accountId, year, month);
    res.json(bankAccounts);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/bank-accounts
 * @summary Create a new bank account for a customer
 * @description Adds a bank account as a payment source for a customer
 * @tags Bank Accounts
 * @security BearerAuth
 * @param {CreateBankAccountRequest} request.body.required - Bank account creation data
 * @return {StripeBankAccount} 201 - Bank account created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const createBankAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId, customerId, accountNumber, routingNumber, country, currency } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient(String(accountId), user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    // Create a bank account token first
    const token = await stripe.tokens.create({
      bank_account: {
        account_number: accountNumber,
        routing_number: routingNumber,
        country,
        currency,
        account_holder_type: 'individual'
      }
    });

    const bankAccount = await stripe.customers.createSource(customerId, {
      source: token.id
    });

    const dbBankAccount = await create({
      userId: user.id,
      stripeAccountId: accountId,
      stripeBankAccountId: bankAccount.id,
      stripeCustomerId: customerId,
      accountNumber: accountNumber.slice(-4),
      routingNumber,
      country,
      currency
    });

    res.json(dbBankAccount);
  } catch (error) {
    next(error);
  }
};
