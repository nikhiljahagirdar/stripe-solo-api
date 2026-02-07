import { db } from '../db';
import { cardsTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

export const findAll = async (userId: number, accountId?: number, year?: number, month?: number) => {
  const conditions: SQL[] = [eq(cardsTable.userId, userId)];
  if (accountId) {
    conditions.push(eq(cardsTable.stripeAccountId, accountId));
  }
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(cardsTable.createdAt, year, month);
  conditions.push(...dateFilters);
  return await db.select().from(cardsTable).where(and(...conditions));
};

export const create = async (data: any) => {
  const result = await db.insert(cardsTable).values(data).returning();
  return result[0];
};