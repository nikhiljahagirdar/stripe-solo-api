import { db } from '../db';
import { eventsTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

export const findAll = async (userId: number, accountId?: number, year?: number, month?: number) => {
  const conditions: SQL[] = [eq(eventsTable.userId, userId)];
  if (accountId) {
    conditions.push(eq(eventsTable.stripeAccountId, accountId));
  }
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(eventsTable.createdAt, year, month);
  conditions.push(...dateFilters);
  return await db.select().from(eventsTable).where(and(...conditions));
};

export const create = async (data: any) => {
  const result = await db.insert(eventsTable).values(data).returning();
  return result[0];
};