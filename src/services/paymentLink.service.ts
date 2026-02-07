import { db } from '../db';
import { paymentLinksTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

export const findAll = async (userId: number, accountId?: number, year?: number, month?: number) => {
  const conditions: SQL[] = [eq(paymentLinksTable.userId, userId)];
  if (accountId) {
    conditions.push(eq(paymentLinksTable.stripeAccountId, accountId));
  }
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(paymentLinksTable.createdAt, year, month);
  conditions.push(...dateFilters);
  return await db.select().from(paymentLinksTable).where(and(...conditions));
};

export const findById = async (id: number, userId: number) => {
  const result = await db.select().from(paymentLinksTable)
    .where(and(eq(paymentLinksTable.id, id), eq(paymentLinksTable.userId, userId)))
    .limit(1);
  return result[0] || null;
};

export const create = async (data: any) => {
  const result = await db.insert(paymentLinksTable).values(data).returning();
  return result[0];
};