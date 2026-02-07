import type Stripe from 'stripe';
import { db } from '../db';
import { setupIntentsTable, type SetupIntent, type NewSetupIntent } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class SetupIntentService {
  async create(userId: number, stripeAccountId: number, setupIntentData: Stripe.SetupIntentCreateParams): Promise<SetupIntent> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Could not create or retrieve Stripe client for account ${stripeAccountId}`);
    }

    const stripeSetupIntent = await stripe.setupIntents.create(setupIntentData);
    // Use the sync method to create the local record
    return this.syncFromStripe(userId, stripeAccountId, stripeSetupIntent.id);
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<SetupIntent[]> {
    const conditions = [eq(setupIntentsTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(setupIntentsTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${setupIntentsTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${setupIntentsTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(setupIntentsTable).where(and(...conditions));
  }

  async findById(userId: number, id: number): Promise<SetupIntent | undefined> {
    const [setupIntent] = await db.select().from(setupIntentsTable)
      .where(and(eq(setupIntentsTable.id, id), eq(setupIntentsTable.userId, userId)))
      .limit(1);
    return setupIntent;
  }

  async confirm(userId: number, stripeAccountId: number, id: number, confirmData: Stripe.SetupIntentConfirmParams): Promise<SetupIntent | null> {
    const setupIntent = await this.findById(userId, id);
    if (!setupIntent) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Could not create or retrieve Stripe client for account ${stripeAccountId}`);
    }

    const confirmedSetupIntent = await stripe.setupIntents.confirm(setupIntent.stripeSetupIntentId, confirmData);

    // Re-sync the entire object to ensure all local fields are up-to-date
    return this.syncFromStripe(userId, stripeAccountId, confirmedSetupIntent.id);
  }

  async cancel(userId: number, stripeAccountId: number, id: number): Promise<SetupIntent | null> {
    const setupIntent = await this.findById(userId, id);
    if (!setupIntent) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Could not create or retrieve Stripe client for account ${stripeAccountId}`);
    }

    const canceledSetupIntent = await stripe.setupIntents.cancel(setupIntent.stripeSetupIntentId);

    // Re-sync the entire object to ensure all local fields are up-to-date
    return this.syncFromStripe(userId, stripeAccountId, canceledSetupIntent.id);
  }

  /**
   * Retrieves a SetupIntent from Stripe and syncs its state to the local database.
   * Creates a new record if it doesn't exist, otherwise updates the existing one.
   */
  async syncFromStripe(userId: number, stripeAccountId: number, stripeSetupIntentId: string): Promise<SetupIntent> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Could not create or retrieve Stripe client for account ${stripeAccountId}`);
    }
    const stripeSetupIntent = await stripe.setupIntents.retrieve(stripeSetupIntentId);

    const setupIntentData = {
      userId,
      stripeAccountId,
      stripeSetupIntentId: stripeSetupIntent.id,
      stripeCustomerId: typeof stripeSetupIntent.customer === 'string' 
        ? stripeSetupIntent.customer 
        : stripeSetupIntent.customer?.id ?? null,
      status: stripeSetupIntent.status,
      usage: stripeSetupIntent.usage,
      created: stripeSetupIntent.created,
    };

    const [existing] = await db.select().from(setupIntentsTable)
      .where(and(eq(setupIntentsTable.stripeSetupIntentId, stripeSetupIntentId), eq(setupIntentsTable.userId, userId)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(setupIntentsTable)
        .set({ ...setupIntentData, updatedAt: new Date() })
        .where(eq(setupIntentsTable.id, existing.id))
        .returning();
      if (!updated) { throw new Error(`Failed to update SetupIntent ${stripeSetupIntentId}`); }
      return updated;
    } else {
      const newSetupIntent: NewSetupIntent = setupIntentData;
      const [created] = await db.insert(setupIntentsTable).values(newSetupIntent).returning();
      if (!created) {
        throw new Error(`Failed to create SetupIntent ${stripeSetupIntentId}`);
      }
      return created;
    }
  }
}