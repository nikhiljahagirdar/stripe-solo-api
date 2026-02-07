import { db } from '../db';
import { subscriptionSchedulesTable, type SubscriptionSchedule, type NewSubscriptionSchedule } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class SubscriptionScheduleService {
  async create(userId: number, stripeAccountId: number, scheduleData: any): Promise<SubscriptionSchedule> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeSchedule = await stripe.subscriptionSchedules.create(scheduleData);
    
    const newSchedule: NewSubscriptionSchedule = {
      userId,
      stripeAccountId,
      stripeScheduleId: stripeSchedule.id,
      stripeCustomerId: stripeSchedule.customer as string,
      stripeSubscriptionId: stripeSchedule.subscription as string,
      status: stripeSchedule.status,
      currentPhase: stripeSchedule.current_phase?.start_date ? 0 : null,
      metadata: JSON.stringify(stripeSchedule.metadata),
    };

    const [schedule] = await db.insert(subscriptionSchedulesTable).values(newSchedule).returning();
    return schedule!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<SubscriptionSchedule[]> {
    const conditions = [eq(subscriptionSchedulesTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(subscriptionSchedulesTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${subscriptionSchedulesTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${subscriptionSchedulesTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(subscriptionSchedulesTable).where(and(...conditions));
  }

  async findById(userId: number, id: number): Promise<SubscriptionSchedule | undefined> {
    const [schedule] = await db.select().from(subscriptionSchedulesTable)
      .where(and(eq(subscriptionSchedulesTable.id, id), eq(subscriptionSchedulesTable.userId, userId)))
      .limit(1);
    return schedule!;
  }

  async cancel(userId: number, stripeAccountId: number, id: number): Promise<SubscriptionSchedule | null> {
    const schedule = await this.findById(userId, id);
    if (!schedule) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const canceledSchedule = await stripe.subscriptionSchedules.cancel(schedule.stripeScheduleId);

    const [updated] = await db.update(subscriptionSchedulesTable)
      .set({ status: canceledSchedule.status, updatedAt: new Date() })
      .where(and(eq(subscriptionSchedulesTable.id, id), eq(subscriptionSchedulesTable.userId, userId)))
      .returning();
    
    return updated!;
  }
}