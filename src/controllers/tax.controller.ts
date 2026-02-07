import type { Request, Response, NextFunction } from 'express';
import { getTaxSettings as getTaxSettingsService, upsertTaxSettings as upsertTaxSettingsService } from '../services/tax.service';
import { db } from '../db';
import { stripeAccounts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * A Tax Setting object.
 * @typedef {object} TaxSetting
 * @property {number} id - The tax setting ID.
 * @property {number} accountId - The ID of the Stripe Account these settings belong to.
 * @property {string} taxMode.required - The tax mode ('automatic', 'manual', 'disabled').
 * @property {string} [defaultTaxCode] - The default Stripe Tax code for automatic mode.
 * @property {number} [manualTaxPercent] - The manual tax percentage (e.g., 18.00).
 * @property {boolean} requireAddress - Whether to require a customer address.
 */

/**
 * GET /api/tax-settings/{accountId}
 * @summary Retrieve tax settings for a Stripe account
 * @description Fetches the tax settings for a specific Stripe account.
 * @tags Tax
 * @security BearerAuth
 * @param {number} accountId.path.required - The ID of the Stripe Account.
 * @return {TaxSetting} 200 - The tax settings object.
 * @return {object} 401 - Unauthorized - Invalid or missing token.
 * @return {object} 404 - Not Found - Settings not found or user not authorized.
 * @return {object} 500 - Internal Server Error.
 */
export const getTaxSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accountId = Number(req.params['accountId']);
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' }); return;
    }

    const settings = await getTaxSettingsService(accountId, user.id);
    if (!settings) {
      res.status(404).json({ message: 'Tax settings not found or you are not authorized to view them.' }); return;
    }

    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};

/**
 * A new or updated Tax Setting object for the request body.
 * @typedef {object} UpsertTaxSetting
 * @property {string} taxMode.required - The tax mode ('automatic', 'manual', 'disabled').
 * @property {string} [defaultTaxCode] - The default Stripe Tax code for automatic mode.
 * @property {number} [manualTaxPercent] - The manual tax percentage (e.g., 18.00).
 * @property {boolean} [requireAddress] - Whether to require a customer address.
 */

/**
 * POST /api/tax-settings/{accountId}
 * @summary Create or update tax settings for a Stripe account
 * @description Creates or updates the tax settings for a specific Stripe account.
 * @tags Tax
 * @security BearerAuth
 * @param {number} accountId.path.required - The ID of the Stripe Account.
 * @param {UpsertTaxSetting} request.body.required - The tax settings details.
 * @return {TaxSetting} 200 - The created or updated tax settings object.
 * @return {object} 401 - Unauthorized - Invalid or missing token.
 * @return {object} 403 - Forbidden - User is not authorized to modify this account.
 * @return {object} 500 - Internal Server Error.
 */
export const upsertTaxSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accountId = Number(req.params['accountId']);
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' }); return;
    }

    // Authorization check: Ensure the user owns the stripe account they are trying to modify.
    const [account] = await db.select().from(stripeAccounts).where(and(eq(stripeAccounts.id, accountId), eq(stripeAccounts.userId, user.id)));
    if (!account) {
      res.status(403).json({ message: 'You are not authorized to modify these tax settings.' }); return;
    }

    const updatedSettings = await upsertTaxSettingsService({
      accountId,
      ...req.body,
    });

    res.status(200).json(updatedSettings);
  } catch (error) {
    next(error);
  }
};
