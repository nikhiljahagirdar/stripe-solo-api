import Stripe from 'stripe';
import { db } from '../db';
import { stripeAccounts, stripeKeys, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from './encryption';

/**
 * Initializes and returns a Stripe client for a given account.
 * This function handles decryption of the secret key and caches the client.
 *
 * @param {string|number} accountIdentifier - Either the Stripe Account ID (e.g., 'acct_...') or database ID.
 * @param {number} userId - The ID of the user making the request.
 * @returns {Promise<Stripe | null>} A configured Stripe instance or null if not found/authorized.
 */
export async function getOrCreateStripeClient(accountIdentifier: string | number, userId: number): Promise<Stripe | null> {
  // Fetch user's parentId
  const [userRecord] = await db
    .select({ parentId: users.parentId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const effectiveUserId = userRecord?.parentId && userRecord.parentId !== 0 ? userRecord.parentId : userId;

  const isDbId = typeof accountIdentifier === 'number' || /^\d+$/.test(accountIdentifier.toString());
  
  const result = await db.select({
    encryptedApiKey: stripeKeys.encryptedApiKey,
  })
    .from(stripeAccounts)
    .innerJoin(stripeKeys, eq(stripeAccounts.stripe_key_id, stripeKeys.id))
    .where(and(
      isDbId ? eq(stripeAccounts.id, Number(accountIdentifier as any)) : eq(stripeAccounts.stripeAccountId, accountIdentifier.toString()),
      eq(stripeKeys.userId, effectiveUserId)
    ))
    .limit(1);
 

  if (!result || result.length === 0 || !result[0]?.encryptedApiKey) {
    return null;
  }

  const { encryptedApiKey } = result[0];

  try {
    const decryptedKey = decrypt(encryptedApiKey);
    // Using a specific API version for consistency.
    return new Stripe(decryptedKey);
  } catch (error) {
    console.error(`Failed to decrypt Stripe key for account identifier ${accountIdentifier}:`, error);
    throw new Error(`Failed to process credentials for account identifier ${accountIdentifier}.`);
  }
}