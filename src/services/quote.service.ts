import { db } from '../db';
import { quotesTable, type Quote, type NewQuote } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class QuoteService {
  async create(userId: number, stripeAccountId: number, quoteData: any): Promise<Quote> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeQuote = await stripe.quotes.create(quoteData);
    
    const newQuote: NewQuote = {
      userId,
      stripeAccountId,
      stripeQuoteId: stripeQuote.id,
      stripeCustomerId: stripeQuote.customer as string,
      status: stripeQuote.status,
      amountTotal: (stripeQuote.amount_total / 100).toString(),
      currency: stripeQuote.currency,
      url: '',
    };

    const [quote] = await db.insert(quotesTable).values(newQuote).returning();
    return quote!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<Quote[]> {
    const conditions = [eq(quotesTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(quotesTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${quotesTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${quotesTable.createdAt} <= ${endDate}`);
    }
    const quotes = await db.select().from(quotesTable).where(and(...conditions));
    return quotes!;
  }

  async findById(userId: number, id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotesTable)
      .where(and(eq(quotesTable.id, id), eq(quotesTable.userId, userId)))
      .limit(1);
    return quote!;
  }

  async finalize(userId: number, stripeAccountId: number, id: number): Promise<Quote | null> {
    const quote = await this.findById(userId, id);
    if (!quote) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const finalizedQuote = await stripe.quotes.finalizeQuote(quote.stripeQuoteId);

    const [updated] = await db.update(quotesTable)
      .set({ 
        status: finalizedQuote.status,
        amountTotal: (finalizedQuote.amount_total / 100).toString(),
        updatedAt: new Date() 
      })
      .where(and(eq(quotesTable.id, id), eq(quotesTable.userId, userId)))
      .returning();
    
    return updated || null;
  }

  async accept(userId: number, stripeAccountId: number, id: number): Promise<Quote | null> {
    const quote = await this.findById(userId, id);
    if (!quote) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const acceptedQuote = await stripe.quotes.accept(quote.stripeQuoteId);

    const [updated] = await db.update(quotesTable)
      .set({ 
        status: acceptedQuote.status,
        updatedAt: new Date() 
      })
      .where(and(eq(quotesTable.id, id), eq(quotesTable.userId, userId)))
      .returning();
    
    return updated || null;
  }

  async cancel(userId: number, stripeAccountId: number, id: number): Promise<Quote | null> {
    const quote = await this.findById(userId, id);
    if (!quote) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const canceledQuote = await stripe.quotes.cancel(quote.stripeQuoteId);

    const [updated] = await db.update(quotesTable)
      .set({ 
        status: canceledQuote.status,
        updatedAt: new Date() 
      })
      .where(and(eq(quotesTable.id, id), eq(quotesTable.userId, userId)))
      .returning();
    
    return updated || null;
  }
}