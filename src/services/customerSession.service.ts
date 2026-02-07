import { db } from '../db';
import { customerSessionsTable, type CustomerSession, type NewCustomerSession } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class CustomerSessionService {
  async create(userId: number, stripeAccountId: number, sessionData: any): Promise<CustomerSession> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeSession = await stripe.customerSessions.create(sessionData);
    
    const newSession: NewCustomerSession = {
      userId,
      stripeAccountId,
      stripeSessionId: '',
      stripeCustomerId: stripeSession.customer as string,
      clientSecret: stripeSession.client_secret,
    };

    const [session] = await db.insert(customerSessionsTable).values(newSession).returning();
    return session!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<CustomerSession[]> {
    const conditions = [eq(customerSessionsTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(customerSessionsTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${customerSessionsTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${customerSessionsTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(customerSessionsTable).where(and(...conditions));
  }

  async findById(userId: number, id: number): Promise<CustomerSession | undefined> {
    const [session] = await db.select().from(customerSessionsTable)
      .where(and(eq(customerSessionsTable.id, id), eq(customerSessionsTable.userId, userId)))
      .limit(1);
    return session!;
  }
}