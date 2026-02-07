import { db } from '../db';
import { checkoutSessionsTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

export const findAll = async (userId: number, accountId?: number, year?: number, month?: number) => {
  const conditions: SQL[] = [eq(checkoutSessionsTable.userId, userId)];
  if (accountId) {
    conditions.push(eq(checkoutSessionsTable.stripeAccountId, accountId));
  }
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(checkoutSessionsTable.createdAt, year, month);
  conditions.push(...dateFilters);
  const sessions = await db.select().from(checkoutSessionsTable).where(and(...conditions));
  return sessions;
};

export const findById = async (id: number, userId: number) => {
  const result = await db.select().from(checkoutSessionsTable)
    .where(and(eq(checkoutSessionsTable.id, id), eq(checkoutSessionsTable.userId, userId)))
    .limit(1);
  return result[0] || null;
};

export const create = async (data: any) => {
  const result = await db.insert(checkoutSessionsTable).values(data).returning();
  return result[0];
};