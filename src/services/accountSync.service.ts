import Stripe from 'stripe';
import { db } from '../db';
import type { NewStripeAccount } from '../db/schema';
import { stripeAccounts, stripeKeys } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from './encryption';
/**
 * Fetches all connected accounts from Stripe and syncs them with the local database.
 * This function uses an "upsert" operation to efficiently insert new accounts and update existing ones.
 *
 * @param {number} userId - The ID of the user who owns the Stripe key.
 * @param {number} stripeKeyId - The ID of the stripe_keys record to use for API authentication.
 * @returns {Promise<boolean>} A boolean indicating whether any accounts were synced.
 */
export async function syncStripeAccounts(userId: number, stripeKeyId: number): Promise<boolean> {
  const keyRecord = await db.select({ encryptedApiKey: stripeKeys.encryptedApiKey })
    .from(stripeKeys)
    .where(and(eq(stripeKeys.id, stripeKeyId), eq(stripeKeys.userId, userId)))
    .limit(1);

  if ((keyRecord.length === 0) || !keyRecord[0]!.encryptedApiKey) {
    throw new Error(`Stripe key not found or is invalid for key ID: ${stripeKeyId}`);
  }

  let platformStripeClient: Stripe;
  try {
    const decryptedKey = decrypt(keyRecord[0]!.encryptedApiKey);
    platformStripeClient = new Stripe(decryptedKey);
  } catch (error) {
    console.error(`Failed to decrypt Stripe key for key ID ${stripeKeyId}:`, error);
    throw new Error(`Failed to process credentials for key ID ${stripeKeyId}.`);
  }

  const stripeApiAccounts: Stripe.Account[] = [];
  for await (const account of platformStripeClient.accounts.list({ limit: 100 })) {
    stripeApiAccounts.push(account);
  }

  if (stripeApiAccounts.length === 0) {
    return false;
  }

  const accountsToUpsert: NewStripeAccount[] = stripeApiAccounts.map(account => ({
    userId: userId,
    stripe_key_id: stripeKeyId,
    stripeAccountId: account.id,
    type: account.type,
    businessType: account.business_type,
    country: account.country,
    defaultCurrency: account.default_currency,
    detailsSubmitted: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    email: account.email,
    displayName: account.settings?.dashboard.display_name,
    businessProfileName: account.business_profile?.name,
    businessProfileUrl: account.business_profile?.url,
  }));

  await db.insert(stripeAccounts).values(accountsToUpsert)
    .onConflictDoUpdate({ target: stripeAccounts.stripeAccountId, set: { ...accountsToUpsert[0] } });

 return true;
}