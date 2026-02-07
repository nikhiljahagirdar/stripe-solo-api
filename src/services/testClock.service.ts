import { db } from '../db';
import { testClocksTable, type TestClock, type NewTestClock } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class TestClockService {
  async create(userId: number, stripeAccountId: number, testClockData: any): Promise<TestClock> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeTestClock = await stripe.testHelpers.testClocks.create(testClockData);
    
    const newTestClock: NewTestClock = {
      userId,
      stripeAccountId,
      stripeClockId: stripeTestClock.id,
      frozenTime: stripeTestClock.frozen_time,
    };

    const [testClock] = await db.insert(testClocksTable).values(newTestClock).returning();
    return testClock!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<TestClock[]> {
    const conditions = [eq(testClocksTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(testClocksTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${testClocksTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${testClocksTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(testClocksTable).where(and(...conditions));
  }

  async findById(userId: number, id: number): Promise<TestClock | undefined> {
    const [testClock] = await db.select().from(testClocksTable)
      .where(and(eq(testClocksTable.id, id), eq(testClocksTable.userId, userId)))
      .limit(1);
    return testClock!;
  }

  async advance(userId: number, stripeAccountId: number, id: number, frozenTime: number): Promise<TestClock | null> {
    const testClock = await this.findById(userId, id);
    if (!testClock) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const advancedClock = await stripe.testHelpers.testClocks.advance(testClock.stripeClockId, { frozen_time: frozenTime });

    const [updated] = await db.update(testClocksTable)
      .set({ frozenTime: advancedClock.frozen_time, updatedAt: new Date() })
      .where(and(eq(testClocksTable.id, id), eq(testClocksTable.userId, userId)))
      .returning();
    
    return updated!;
  }
}