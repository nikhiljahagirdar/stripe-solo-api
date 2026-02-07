import { db } from '../db';
import { plansTable, type Plan, type NewPlan } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class PlanService {
  async create(userId: number, stripeAccountId: number, planData: any): Promise<Plan> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripePlan = await stripe.plans.create(planData);
    
    const newPlan: NewPlan = {
      userId,
      stripeAccountId,
      stripePlanId: stripePlan.id,
      stripePriceId: stripePlan.id, // Plans are now prices in modern Stripe
      amount: ((stripePlan.amount || 0) / 100).toString(),
      currency: stripePlan.currency,
      interval: stripePlan.interval,
      intervalCount: stripePlan.interval_count,
    };

    const [plan] = await db.insert(plansTable).values(newPlan).returning();
    return plan!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<Plan[]> {
    const conditions = [eq(plansTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(plansTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${plansTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${plansTable.createdAt} <= ${endDate}`);
    }
    const plans = await db.select().from(plansTable).where(and(...conditions));
    return plans!;
  }

  async findById(userId: number, id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plansTable)
      .where(and(eq(plansTable.id, id), eq(plansTable.userId, userId)))
      .limit(1);
    return plan!;
  }

  async delete(userId: number, stripeAccountId: number, id: number): Promise<boolean> {
    const plan = await this.findById(userId, id);
    if (!plan) {return false;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    await stripe.plans.del(plan.stripePlanId);

    await db.delete(plansTable)
      .where(and(eq(plansTable.id, id), eq(plansTable.userId, userId)));
    
    return true!;
  }
}