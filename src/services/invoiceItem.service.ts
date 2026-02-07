import { db } from '../db';
import { invoiceItemsTable, type InvoiceItem, type NewInvoiceItem } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class InvoiceItemService {
  async create(userId: number, stripeAccountId: number, itemData: any): Promise<InvoiceItem> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeItem = await stripe.invoiceItems.create(itemData);
    
    const newItem: NewInvoiceItem = {
      userId,
      stripeAccountId,
      stripeInvoiceItemId: stripeItem.id,
      stripeInvoiceId: stripeItem.invoice as string,
      stripeCustomerId: stripeItem.customer as string,
      stripePriceId: typeof stripeItem.pricing?.price_details?.price === 'string' ? stripeItem.pricing.price_details.price : (stripeItem.pricing?.price_details?.price as any)?.id,
      amount: (stripeItem.amount / 100).toString(),
      currency: stripeItem.currency,
      description: stripeItem.description,
      metadata: JSON.stringify(stripeItem.metadata),
    };

    const [item] = await db.insert(invoiceItemsTable).values(newItem).returning();
    return item!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<InvoiceItem[]> {
    const conditions = [eq(invoiceItemsTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(invoiceItemsTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${invoiceItemsTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${invoiceItemsTable.createdAt} <= ${endDate}`);
    }
    const items = await db.select().from(invoiceItemsTable).where(and(...conditions));
    return items!;
  }

  async findById(userId: number, id: number): Promise<InvoiceItem | undefined> {
    const [item] = await db.select().from(invoiceItemsTable)
      .where(and(eq(invoiceItemsTable.id, id), eq(invoiceItemsTable.userId, userId)))
      .limit(1);
    return item!;
  }

  async update(userId: number, stripeAccountId: number, id: number, updateData: any): Promise<InvoiceItem | null> {
    const item = await this.findById(userId, id);
    if (!item) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const updatedItem = await stripe.invoiceItems.update(item.stripeInvoiceItemId, updateData);

    const [updated] = await db.update(invoiceItemsTable)
      .set({ 
        amount: (updatedItem.amount / 100).toString(),
        description: updatedItem.description,
        metadata: JSON.stringify(updatedItem.metadata),
        updatedAt: new Date() 
      })
      .where(and(eq(invoiceItemsTable.id, id), eq(invoiceItemsTable.userId, userId)))
      .returning();
    
    return updated || null;
  }

  async delete(userId: number, stripeAccountId: number, id: number): Promise<boolean> {
    const item = await this.findById(userId, id);
    if (!item) {return false;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    await stripe.invoiceItems.del(item.stripeInvoiceItemId);

    await db.delete(invoiceItemsTable)
      .where(and(eq(invoiceItemsTable.id, id), eq(invoiceItemsTable.userId, userId)));
    
    return true!;
  }
}