import { db } from '../db';
import type { StripeAccount, NewStripeAccount} from '../db/schema';
import { stripeAccounts, stripeKeys } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { decrypt } from './encryption';
import Stripe from 'stripe';

export async function listAccountsByUserId(userId: number, accountId?: number, year?: number): Promise<StripeAccount[] | []> {
  
  const conditions = [eq(stripeAccounts.userId, userId)];

  if (accountId) {
    conditions.push(eq(stripeAccounts.id, accountId));
  }

  if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    conditions.push(sql`${stripeAccounts.createdAt} >= ${startDate}`);
    conditions.push(sql`${stripeAccounts.createdAt} <= ${endDate}`);
  }

  return db.select().from(stripeAccounts).where(and(...conditions));
}

export async function getAccountById(userId: number, accountId: number): Promise<StripeAccount | null> {
  const [account] = await db
    .select()
    .from(stripeAccounts)
    .where(and(eq(stripeAccounts.id, accountId), eq(stripeAccounts.userId, userId)))
    .limit(1);
  return account || null;
}

export async function syncStripeAccount(userId: number, stripeKeyId: number): Promise<StripeAccount> {
  const [keyRecord] = await db
    .select({ encryptedApiKey: stripeKeys.encryptedApiKey })
    .from(stripeKeys)
    .where(and(eq(stripeKeys.id, stripeKeyId), eq(stripeKeys.userId, userId)))
    .limit(1);

  if (!keyRecord?.encryptedApiKey) {
    throw new Error('API key not found');
  }

  const apiKey = decrypt(keyRecord.encryptedApiKey);
  const stripe = new Stripe(apiKey);
  const account = await stripe.accounts.retrieve();

  const accountData: NewStripeAccount = {
    userId,
    stripe_key_id: stripeKeyId,
    stripeAccountId: account.id,
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
    type: account.type,
  };

  const [existing] = await db
    .select()
    .from(stripeAccounts)
    .where(and(eq(stripeAccounts.stripeAccountId, account.id), eq(stripeAccounts.userId, userId)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(stripeAccounts)
      .set({ ...accountData, updatedAt: new Date() })
      .where(eq(stripeAccounts.id, existing.id))
      .returning();
    return updated!;
  }

  const [created] = await db.insert(stripeAccounts).values(accountData).returning();
  return created!;
}

export async function deleteAccount(userId: number, accountId: number): Promise<boolean> {
  const result = await db
    .delete(stripeAccounts)
    .where(and(eq(stripeAccounts.id, accountId), eq(stripeAccounts.userId, userId)))
    .returning();
  return result.length > 0;
}