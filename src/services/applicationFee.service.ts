import { db } from '../db';
import { applicationFeesTable, type NewApplicationFee } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class ApplicationFeeService {
  async findByUser(userId: number, accountId?: number, year?: number): Promise<any[]> {
    const conditions = [eq(applicationFeesTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(applicationFeesTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${applicationFeesTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${applicationFeesTable.createdAt} <= ${endDate}`);
    }
    const fees = await db.select().from(applicationFeesTable).where(and(...conditions));
    return fees;
  }

  async findById(userId: number, id: number): Promise<any> {
    const [fee] = await db.select().from(applicationFeesTable)
      .where(and(eq(applicationFeesTable.id, id), eq(applicationFeesTable.userId, userId)))
      .limit(1);
    return fee;
  }

  async syncFromStripe(userId: number, stripeAccountId: number, stripeApplicationFeeId: string): Promise<any> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeApplicationFee = await stripe.applicationFees.retrieve(stripeApplicationFeeId);
    
    const [existing] = await db.select().from(applicationFeesTable)
      .where(and(eq(applicationFeesTable.stripeApplicationFeeId, stripeApplicationFeeId), eq(applicationFeesTable.userId, userId)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(applicationFeesTable)
        .set({ 
          amount: (stripeApplicationFee.amount / 100).toString(),
          amountRefunded: (stripeApplicationFee.amount_refunded / 100).toString(),
          updatedAt: new Date() 
        })
        .where(eq(applicationFeesTable.id, existing.id))
        .returning();
      return updated;
    }

    const newApplicationFee: NewApplicationFee = {
      userId,
      stripeAccountId,
      stripeApplicationFeeId: stripeApplicationFee.id,
      stripeChargeId: stripeApplicationFee.charge as string,
      amount: (stripeApplicationFee.amount / 100).toString(),
      currency: stripeApplicationFee.currency,
      amountRefunded: (stripeApplicationFee.amount_refunded / 100).toString(),
    };

    const [fee] = await db.insert(applicationFeesTable).values(newApplicationFee).returning();
    return fee;
  }
}