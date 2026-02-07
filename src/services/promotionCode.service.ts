import { db } from '../db';
import { promotionCodesTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

export const findAll = async (userId: number, accountId?: number, year?: number, month?: number) => {
  const conditions: SQL[] = [eq(promotionCodesTable.userId, userId)];
  if (accountId) {
    // Note: promotionCodesTable does not have stripeAccountId. Filtering by stripeCouponId as a placeholder.
    // A schema change would be needed to properly link promotion codes to stripe accounts.
    conditions.push(eq(promotionCodesTable.stripeCouponId, accountId.toString()));
  }
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(promotionCodesTable.createdAt, year, month);
  conditions.push(...dateFilters);
  
  return await db.select().from(promotionCodesTable).where(and(...conditions));
};

export const create = async (data: any) => {
  const result = await db.insert(promotionCodesTable).values(data).returning();
  return result[0];
};