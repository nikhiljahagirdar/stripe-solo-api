import { db } from '../db';
import { transfersTable, type Transfer, type NewTransfer } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import { getOrCreateStripeClient } from './client.service';

export class TransferService {
  async findByUser(userId: number, accountId?: number, year?: number): Promise<Transfer[]> {
    const conditions = [eq(transfersTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(transfersTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${transfersTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${transfersTable.createdAt} <= ${endDate}`);
    }
    const transfers = await db.select().from(transfersTable).where(and(...conditions));
    return transfers;
  }

  async findById(userId: number, id: number): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfersTable)
      .where(and(eq(transfersTable.id, id), eq(transfersTable.userId, userId)))
      .limit(1);
    return transfer;
  }

  async create(userId: number, stripeAccountId: number, transferData: Stripe.TransferCreateParams): Promise<Transfer> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Stripe client not found for account ${stripeAccountId}`);
    }

    const stripeTransfer = await stripe.transfers.create(transferData);

    // After creating, use syncFromStripe to ensure the local DB is consistent
    // and we create a local record for the new transfer.
    // This avoids duplicating the logic for creating a local DB entry.
    return this.syncFromStripe(userId, stripeAccountId, stripeTransfer.id);
  }

  /**
   * Retrieves a transfer from Stripe and syncs its state to the local database.
   * Creates a new record if it doesn't exist, otherwise updates the existing one.
   */
  async syncFromStripe(userId: number, stripeAccountId: number, stripeTransferId: string): Promise<Transfer> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Stripe client not found for account ${stripeAccountId}`);
    }

    const stripeTransfer = await stripe.transfers.retrieve(stripeTransferId);
    if (!stripeTransfer) {
      throw new Error(`Transfer with ID ${stripeTransferId} not found on Stripe account ${stripeAccountId}.`);
    }

    // Safely determine the destination account ID
    let destinationId: string | null = null;
    if (typeof stripeTransfer.destination === 'string') {
      destinationId = stripeTransfer.destination;
    } else if (stripeTransfer.destination) { // It's a Stripe.Account object
      destinationId = stripeTransfer.destination.id;
    }

    const transferData = {
      userId,
      stripeAccountId,
      stripeTransferId: stripeTransfer.id,
      amount: (stripeTransfer.amount / 100).toString(),
      currency: stripeTransfer.currency,
      destination: destinationId,
      status: stripeTransfer.reversed ? 'reversed' : 'succeeded',
      // Assuming metadata is stored as a JSON string in the DB
      metadata: stripeTransfer.metadata ? JSON.stringify(stripeTransfer.metadata) : null,
    };

    // Check if transfer already exists to decide whether to insert or update
    const [existing] = await db.select().from(transfersTable)
      .where(and(
        eq(transfersTable.stripeTransferId, stripeTransfer.id),
        eq(transfersTable.userId, userId)
      ))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(transfersTable)
        .set({
          ...transferData,
          updatedAt: new Date()
        })
        .where(eq(transfersTable.id, existing.id))
        .returning();
      
      if (!updated) {
        throw new Error(`Failed to update existing transfer with ID ${existing.id}.`);
      }
      return updated;
    } else {
      const newTransferRecord: NewTransfer = transferData;
      const [transfer] = await db.insert(transfersTable).values(newTransferRecord).returning();
      
      if (!transfer) {
        throw new Error('Failed to create new transfer record.');
      }
      return transfer;
    }
  }

  async reverse(userId: number, stripeAccountId: number, id: number, reverseData: Stripe.TransferUpdateParams): Promise<Transfer> {
    const transfer = await this.findById(userId, id);
    if (!transfer) {
      throw new Error(`Transfer with local ID ${id} not found for user ${userId}.`);
    }

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {
      throw new Error(`Stripe client not found for account ${stripeAccountId}`);
    }

    await stripe.transfers.createReversal(transfer.stripeTransferId, reverseData);

    // After reversing, re-sync with Stripe to update the local status to 'reversed'.
    return this.syncFromStripe(userId, stripeAccountId, transfer.stripeTransferId);
  }
}