import { db } from '../db';
import { taxCodesTable, type TaxCode, type NewTaxCode } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';

export class TaxCodeService {
  async findByUser(userId: number, accountId?: number, year?: number): Promise<TaxCode[]> {
    const conditions = [eq(taxCodesTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(taxCodesTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${taxCodesTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${taxCodesTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(taxCodesTable).where(and(...conditions));
  }

  async findById(userId: number, id: number): Promise<TaxCode | undefined> {
    const [taxCode] = await db.select().from(taxCodesTable)
      .where(and(eq(taxCodesTable.id, id), eq(taxCodesTable.userId, userId)))
      .limit(1);
    return taxCode!;
  }

  async syncFromStripe(userId: number, stripeAccountId: number, stripeTaxCodeId: string): Promise<TaxCode> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    const stripeTaxCode = await stripe.taxCodes.retrieve(stripeTaxCodeId);
    
    const [existing] = await db.select().from(taxCodesTable)
      .where(and(eq(taxCodesTable.stripeTaxCodeId, stripeTaxCodeId), eq(taxCodesTable.userId, userId)))
      .limit(1);

    if (existing) {
      return existing!;
    }

    const newTaxCode: NewTaxCode = {
      userId,
      stripeAccountId,
      stripeTaxCodeId: stripeTaxCode.id,
      name: stripeTaxCode.name,
      description: stripeTaxCode.description,
    };

    const [taxCode] = await db.insert(taxCodesTable).values(newTaxCode).returning();
    return taxCode!;
  }
}