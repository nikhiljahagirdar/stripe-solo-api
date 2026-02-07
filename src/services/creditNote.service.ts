import { db } from '../db';
import { creditNotesTable, type CreditNote, type NewCreditNote } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class CreditNoteService {
  async create(userId: number, stripeAccountId: number, creditNoteData: any): Promise<CreditNote> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeCreditNote = await stripe.creditNotes.create(creditNoteData);
    
    const newCreditNote: NewCreditNote = {
      userId,
      stripeAccountId,
      stripeCreditNoteId: stripeCreditNote.id,
      stripeInvoiceId: stripeCreditNote.invoice as string,
      stripeCustomerId: stripeCreditNote.customer as string,
      amount: (stripeCreditNote.amount / 100).toString(),
      currency: stripeCreditNote.currency,
      status: stripeCreditNote.status,
      reason: stripeCreditNote.reason,
      memo: stripeCreditNote.memo,
    };

    const [creditNote] = await db.insert(creditNotesTable).values(newCreditNote).returning();
    return creditNote!;
  }

  async findByUser(userId: number, accountId?: number, year?: number): Promise<CreditNote[]> {
    const conditions = [eq(creditNotesTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(creditNotesTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${creditNotesTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${creditNotesTable.createdAt} <= ${endDate}`);
    }
    const creditNotes = await db.select().from(creditNotesTable).where(and(...conditions));
    return creditNotes;
  }

  async findById(userId: number, id: number): Promise<CreditNote | undefined> {
    const [creditNote] = await db.select().from(creditNotesTable)
      .where(and(eq(creditNotesTable.id, id), eq(creditNotesTable.userId, userId)))
      .limit(1);
    return creditNote;
  }

  async voidCreditNote(userId: number, stripeAccountId: number, id: number): Promise<CreditNote | null> {
    const creditNote = await this.findById(userId, id);
    if (!creditNote) {return null;}

    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const voidedCreditNote = await stripe.creditNotes.voidCreditNote(creditNote.stripeCreditNoteId);

    const [updated] = await db.update(creditNotesTable)
      .set({ status: voidedCreditNote.status, updatedAt: new Date() })
      .where(and(eq(creditNotesTable.id, id), eq(creditNotesTable.userId, userId)))
      .returning();
    
    return updated || null;
  }
}