import { db } from '../db';
import { mandatesTable, type Mandate, type NewMandate } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class MandateService {
  async findByUser(userId: number, accountId?: number, year?: number): Promise<Mandate[]> {
    const conditions = [eq(mandatesTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(mandatesTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${mandatesTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${mandatesTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(mandatesTable).where(and(...conditions));
  }

  async findById(userId: number, id: number): Promise<Mandate | undefined> {
    const [mandate] = await db.select().from(mandatesTable)
      .where(and(eq(mandatesTable.id, id), eq(mandatesTable.userId, userId)))
      .limit(1);
    return mandate;
  }

  async syncFromStripe(userId: number, stripeAccountId: number, stripeMandateId: string): Promise<Mandate> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    
    const stripeMandate = await stripe.mandates.retrieve(stripeMandateId);
    if (!stripeMandate) {
      throw new Error(`Mandate with ID ${stripeMandateId} not found on Stripe account ${stripeAccountId}.`);
    }
    
    // Retrieve the payment method to get the customer ID
    const paymentMethod = await stripe.paymentMethods.retrieve(stripeMandate.payment_method as string);
    
    const mandateData = {
      userId,
      stripeAccountId,
      stripeMandateId: stripeMandate.id,
      stripeCustomerId: typeof paymentMethod.customer === 'string' ? paymentMethod.customer : null,
      type: stripeMandate.type,
      status: stripeMandate.status,
    };

    // Check if mandate already exists
    const [existing] = await db.select().from(mandatesTable)
      .where(and(eq(mandatesTable.stripeMandateId, stripeMandate.id), eq(mandatesTable.userId, userId)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(mandatesTable)
        .set({ 
          ...mandateData,
          updatedAt: new Date() 
        })
        .where(eq(mandatesTable.id, existing.id))
        .returning();
      
      if (!updated) {
        throw new Error(`Failed to update existing mandate with ID ${existing.id}.`);
      }
      return updated;
    }

    const [mandate] = await db.insert(mandatesTable).values(mandateData as NewMandate).returning();
    if (!mandate) {
      throw new Error(`Failed to create new mandate record for Stripe Mandate ID ${stripeMandateId}.`);
    }
    return mandate;
  }
}
