import { db } from '../db';
import { topUpsTable, type TopUp, type NewTopUp } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class TopUpService {
  async create(userId: number, stripeAccountId: number, topUpData: any): Promise<TopUp> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeTopUp = await stripe.topups.create(topUpData);
    
    const newTopUp: NewTopUp = {
      userId,
      stripeAccountId,
      stripeTopUpId: stripeTopUp.id,
      amount: (stripeTopUp.amount / 100).toString(),
      currency: stripeTopUp.currency,
      status: stripeTopUp.status,
    };

    const [topUp] = await db.insert(topUpsTable).values(newTopUp).returning();
    return topUp!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<TopUp[]> {
    const conditions = [eq(topUpsTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(topUpsTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${topUpsTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${topUpsTable.createdAt} <= ${endDate}`);
    }
    const topUps = await db.select().from(topUpsTable).where(and(...conditions));
    return topUps!;
  }

  async findById(userId: number, id: number): Promise<TopUp | undefined> {
    const [topUp] = await db.select().from(topUpsTable)
      .where(and(eq(topUpsTable.id, id), eq(topUpsTable.userId, userId)))
      .limit(1);
    return topUp!;
  }
}