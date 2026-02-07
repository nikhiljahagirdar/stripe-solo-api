import { db } from '../db';
import { balanceTable, stripeAccounts } from '../db/schema';
import { and, eq, desc } from 'drizzle-orm';

interface BalanceDetails {
  balance: any;
  account: any;
}

/**
 * Retrieves the current balance and connected account details.
 * @param {number} accountId - The internal ID of the Stripe account.
 * @param {number} userId - The ID of the user making the request.
 * @returns {Promise<BalanceDetails | null>} The balance and account details, or null if not found.
 */
export async function getBalanceAndAccount(
  accountId: number,
  userId: number
): Promise<BalanceDetails | null> {
  // Fetch the latest balance for the account
  const [balance] = await db
    .select()
    .from(balanceTable)
    .where(and(eq(balanceTable.stripeAccountId, accountId), eq(balanceTable.userId, userId)))
    .orderBy(desc(balanceTable.updatedAt))
    .limit(1);

  if (!balance) {
    return null;
  }

  // Fetch the connected account details
  const [account] = await db
    .select()
    .from(stripeAccounts)
    .where(and(eq(stripeAccounts.id, accountId), eq(stripeAccounts.userId, userId)))
    .limit(1);

  if (!account) {
    return null;
  }

  return {
    balance,
    account,
  };
}