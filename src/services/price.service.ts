import type Stripe from 'stripe';
import { db } from '../db';
import { priceTable, productTable, type Price, type NewPrice } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class PriceService {
  async create(userId: number, stripeAccountId: number, priceData: Stripe.PriceCreateParams): Promise<Price> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Could not create or retrieve Stripe client for account ${stripeAccountId}`);
    }
    const stripePrice = await stripe.prices.create(priceData);
    // Use the sync method to create the local record, ensuring consistency
    return this.syncFromStripe(userId, stripeAccountId, stripePrice.id);
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<any[]> {
    const conditions = [eq(priceTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(priceTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${priceTable.created_at} >= ${startDate}`);
      conditions.push(sql`${priceTable.created_at} <= ${endDate}`);
    }
    const prices = await db.select().from(priceTable).where(and(...conditions));
    return prices;
  }

  async findById(userId: number, id: number): Promise<any> {
    const [price] = await db.select().from(priceTable)
      .where(and(eq(priceTable.id, id), eq(priceTable.userId, userId)))
      .limit(1);
    return price;
  }

  async update(userId: number, stripeAccountId: number, id: number, updateData: Stripe.PriceUpdateParams): Promise<any> {
    const price = await this.findById(userId, id);
    if (!price) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Could not create or retrieve Stripe client for account ${stripeAccountId}`);
    }
    const updatedStripePrice = await stripe.prices.update(price.stripePriceId, updateData);
    // Re-sync the entire object to ensure all local fields are up-to-date
    return this.syncFromStripe(userId, stripeAccountId, updatedStripePrice.id);
  }

  /**
   * Retrieves a price from Stripe and syncs its state to the local database.
   * Creates a new record if it doesn't exist, otherwise updates the existing one.
   */
  async syncFromStripe(userId: number, stripeAccountId: number, stripePriceId: string): Promise<any> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Could not create or retrieve Stripe client for account ${stripeAccountId}`);
    }
    const stripePrice = await stripe.prices.retrieve(stripePriceId);

    const priceData = {
      userId,
      stripeAccountId,
      stripeProductId: stripePrice.product as string,
      stripePriceId: stripePrice.id,
      unitAmount: stripePrice.unit_amount ? (stripePrice.unit_amount / 100).toString() : null,
      currency: stripePrice.currency,
      recurringInterval: stripePrice.recurring?.interval,
      active: stripePrice.active,
    };

    const [existing] = await db.select().from(priceTable)
      .where(and(eq(priceTable.stripePriceId, stripePriceId), eq(priceTable.userId, userId)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(priceTable)
        .set({ ...priceData, updated_at: new Date() })
        .where(eq(priceTable.id, existing.id))
        .returning();
      if (!updated) {
        throw new Error(`Failed to update price ${stripePriceId}`);
      }
      return updated;
    } else {
      const newPrice: NewPrice = priceData;
      const [created] = await db.insert(priceTable).values(newPrice).returning();
      if (!created) {
        throw new Error(`Failed to create price ${stripePriceId}`);
      }
      return created;
    }
  }

  async findAllWithProducts(): Promise<any[]> {
    const results = await db
      .select({
        priceId: priceTable.stripePriceId,
        priceIdWithProduct: sql`CONCAT(${priceTable.stripePriceId}, ' - ', ${productTable.name})`.as('priceIdWithProduct'),
        productName: productTable.name,
        unitAmount: priceTable.unitAmount,
        currency: priceTable.currency,
        recurringInterval: priceTable.recurringInterval,
        active: priceTable.active
      })
      .from(priceTable)
      .leftJoin(productTable, eq(priceTable.stripeProductId, productTable.stripeProductId))
      .orderBy(productTable.name);
    
    return results;
  }
}