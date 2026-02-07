import type { Request, Response, NextFunction } from 'express';
import { findAll, create } from '../services/connect.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Connect account creation request.
 * @typedef {object} CreateConnectAccountRequest
 * @property {string} type.required - Type of account (express, standard, custom)
 * @property {string} country.required - Two-letter country code
 * @property {string} email - Email address for the account
 * @property {object} business_profile - Business profile information
 * @property {object} capabilities - Account capabilities to request
 */

/**
 * Stripe Connect account object.
 * @typedef {object} StripeConnectAccount
 * @property {string} id - Unique identifier for the account
 * @property {string} type - Type of account
 * @property {string} country - Two-letter country code
 * @property {string} email - Email address
 * @property {boolean} charges_enabled - Whether charges are enabled
 * @property {boolean} payouts_enabled - Whether payouts are enabled
 * @property {boolean} details_submitted - Whether account details have been submitted
 * @property {number} created - Time at which the account was created
 */

/**
 * GET /api/v1/connect/accounts
 * @summary List all Connect accounts for the authenticated user
 * @description Retrieves all Stripe Connect accounts created by the user
 * @tags Connect
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter connect accounts.
 * @param {number} [year] year.query - A year to filter connect accounts by creation date (e.g., 2024).
 * @param {number} [month] month.query - A month (1-12) to filter connect accounts. If omitted, filters entire year.
 * @return {array} 200 - List of Connect accounts
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const listConnectAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const accounts = await findAll(user.id, accountId, year, month);
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/connect/accounts
 * @summary Create a new Connect account
 * @description Creates a new Stripe Connect account for accepting payments on behalf of others
 * @tags Connect
 * @security BearerAuth
 * @param {CreateConnectAccountRequest} request.body.required - Connect account creation data
 * @return {StripeConnectAccount} 201 - Connect account created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Stripe platform not configured
 * @return {object} 500 - Internal Server Error
 */
export const createConnectAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { type, country, email } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient('platform', user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe platform not configured' }); return;}

    const account = await stripe.accounts.create({
      type,
      country,
      email
    });

    const dbAccount = await create({
      userId: user.id,
      stripeConnectAccountId: account.id,
      type: account.type,
      country: account.country,
      email: account.email,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });

    res.json(dbAccount);
  } catch (error) {
    next(error);
  }
};
