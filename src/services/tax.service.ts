import { db } from '../db';
import type { NewTaxSetting} from '../db/schema';
import { taxSettingsTable, stripeAccounts } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Retrieves the tax settings for a specific Stripe account, ensuring the user is authorized.
 * @param accountId - The internal ID of the stripe_accounts record.
 * @param userId - The ID of the user making the request.
 * @returns The tax settings object or undefined if not found/authorized.
 */
export async function getTaxSettings(accountId: number, userId: number) {
  const [settings] = await db
    .select({ taxSettings: taxSettingsTable })
    .from(taxSettingsTable)
    .innerJoin(stripeAccounts, eq(taxSettingsTable.accountId, stripeAccounts.id))
    .where(and(eq(taxSettingsTable.accountId, accountId), eq(stripeAccounts.userId, userId)))
    .limit(1);

  return settings?.taxSettings;
}

/**
 * Creates or updates the tax settings for a Stripe account.
 * This function performs an "upsert" operation.
 * @param data - The data for the tax settings. Must include accountId.
 * @returns The created or updated tax settings object.
 */
export async function upsertTaxSettings(data: NewTaxSetting) {
  // Ensure the accountId belongs to the user making the request before calling this service.
  // The authorization check should happen in the controller.

  const [result] = await db
    .insert(taxSettingsTable)
    .values(data)
    .onConflictDoUpdate({
      target: taxSettingsTable.accountId,
      set: {
        taxMode: data.taxMode,
        defaultTaxCode: data.defaultTaxCode,
        manualTaxPercent: data.manualTaxPercent,
        requireAddress: data.requireAddress,
        updatedAt: new Date(),
      },
    })
    .returning();

  return result;
}