import { db } from '../db';
import { cashBalanceTable, type NewCashBalance } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class CashBalanceService {
  async findByUser(userId: number, accountId?: number, year?: number): Promise<any[]> {
    const conditions = [eq(cashBalanceTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(cashBalanceTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${cashBalanceTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${cashBalanceTable.createdAt} <= ${endDate}`);
    }
    const balances = await db.select().from(cashBalanceTable).where(and(...conditions));
    return balances;
  }

  async findById(userId: number, id: number): Promise<any> {
    const [cashBalance] = await db.select().from(cashBalanceTable)
      .where(and(eq(cashBalanceTable.id, id), eq(cashBalanceTable.userId, userId)))
      .limit(1);
    return cashBalance;
  }

  async syncFromStripe(userId: number, stripeAccountId: number, stripeCustomerId: string): Promise<any> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeCashBalance = await stripe.customers.retrieveCashBalance(stripeCustomerId);
    
    const [existing] = await db.select().from(cashBalanceTable)
      .where(and(eq(cashBalanceTable.stripeCustomerId, stripeCustomerId), eq(cashBalanceTable.userId, userId)))
      .limit(1);

    const availableBalance = stripeCashBalance.available?.['usd'] || 0;

    if (existing) {
      const [updated] = await db.update(cashBalanceTable)
        .set({ available: availableBalance.toString(), updatedAt: new Date() })
        .where(eq(cashBalanceTable.id, existing.id))
        .returning();
      if (!updated) {
        throw new Error(`Failed to update cash balance for customer ${stripeCustomerId}`);
      }
      return updated;
    }

    const newCashBalance: NewCashBalance = {
      userId,
      stripeAccountId,
      stripeCustomerId,
      available: availableBalance.toString(),
      currency: 'usd', // Assuming 'usd', could be dynamic if your schema supports it
    };

    const [cashBalance] = await db.insert(cashBalanceTable).values(newCashBalance).returning();
    return cashBalance;
  }
}