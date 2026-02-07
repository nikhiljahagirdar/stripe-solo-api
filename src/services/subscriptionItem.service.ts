import { db } from '../db';
import { subscriptionItemsTable, type SubscriptionItem, type NewSubscriptionItem } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class SubscriptionItemService {
  async create(userId: number, stripeAccountId: number, itemData: any): Promise<SubscriptionItem> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeItem = await stripe.subscriptionItems.create(itemData);
    
    const newItem: NewSubscriptionItem = {
      userId,
      stripeAccountId,
      stripeSubscriptionItemId: stripeItem.id,
      stripeSubscriptionId: stripeItem.subscription,
      stripePriceId: stripeItem.price.id,
      quantity: stripeItem.quantity,
      metadata: JSON.stringify(stripeItem.metadata),
    };

    const [item] = await db.insert(subscriptionItemsTable).values(newItem).returning();
    return item!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<SubscriptionItem[]> {
    const conditions = [eq(subscriptionItemsTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(subscriptionItemsTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${subscriptionItemsTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${subscriptionItemsTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(subscriptionItemsTable).where(and(...conditions));
  }

  async findById(userId: number, id: number): Promise<SubscriptionItem | undefined> {
    const [item] = await db.select().from(subscriptionItemsTable)
      .where(and(eq(subscriptionItemsTable.id, id), eq(subscriptionItemsTable.userId, userId)))
      .limit(1);
    return item!;
  }

  async update(userId: number, stripeAccountId: number, id: number, updateData: any): Promise<SubscriptionItem | null> {
    const item = await this.findById(userId, id);
    if (!item) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const updatedItem = await stripe.subscriptionItems.update(item.stripeSubscriptionItemId, updateData);

    const [updated] = await db.update(subscriptionItemsTable)
      .set({ 
        quantity: updatedItem.quantity,
        metadata: JSON.stringify(updatedItem.metadata),
        updatedAt: new Date() 
      })
      .where(and(eq(subscriptionItemsTable.id, id), eq(subscriptionItemsTable.userId, userId)))
      .returning();
    
    return updated!;
  }

  async delete(userId: number, stripeAccountId: number, id: number): Promise<boolean> {
    const item = await this.findById(userId, id);
    if (!item) {return false;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    await stripe.subscriptionItems.del(item.stripeSubscriptionItemId);

    await db.delete(subscriptionItemsTable)
      .where(and(eq(subscriptionItemsTable.id, id), eq(subscriptionItemsTable.userId, userId)));
    
    return true!;
  }
}