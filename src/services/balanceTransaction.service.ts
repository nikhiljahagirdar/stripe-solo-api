import { db } from '../db';
import { balanceTransactionsTable, type NewBalanceTransaction } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class BalanceTransactionService {
  async findByUser(userId: number, accountId?: number, year?: number): Promise<any[]> {
    const conditions = [eq(balanceTransactionsTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(balanceTransactionsTable.stripeAccountId, accountId));
    }
    if (year) {
      const yearNum: number = typeof year === 'string' ? +year : year;
      const startDate = new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));
      conditions.push(sql`${balanceTransactionsTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${balanceTransactionsTable.createdAt} <= ${endDate}`);
    }
    const transactions = await db.select().from(balanceTransactionsTable).where(and(...conditions));
    return transactions;
  }

  async findById(userId: number, id: number): Promise<any> {
    const [transaction] = await db.select().from(balanceTransactionsTable)
      .where(and(eq(balanceTransactionsTable.id, id), eq(balanceTransactionsTable.userId, userId)))
      .limit(1);
    return transaction;
  }

  async syncFromStripe(userId: number, stripeAccountId: number, stripeTransactionId: string): Promise<any> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeTransaction = await stripe.balanceTransactions.retrieve(stripeTransactionId);
    
    const [existing] = await db.select().from(balanceTransactionsTable)
      .where(and(eq(balanceTransactionsTable.stripeTransactionId, stripeTransactionId), eq(balanceTransactionsTable.userId, userId)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(balanceTransactionsTable)
        .set({ status: stripeTransaction.status, updatedAt: new Date() })
        .where(eq(balanceTransactionsTable.id, existing.id))
        .returning();
      return updated;
    }

    const newTransaction: NewBalanceTransaction = {
      userId,
      stripeAccountId,
      stripeTransactionId: stripeTransaction.id,
      type: stripeTransaction.type,
      currency: stripeTransaction.currency,
      amount: (stripeTransaction.amount / 100).toString(),
      fee: (stripeTransaction.fee / 100).toString(),
      net: (stripeTransaction.net / 100).toString(),
      status: stripeTransaction.status,
      stripeChargeId: stripeTransaction.source as string,
    };

    const [transaction] = await db.insert(balanceTransactionsTable).values(newTransaction).returning();
    return transaction;
  }
}