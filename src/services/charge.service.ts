import { db } from '../db';
import { chargesTable } from '../db/schema';
import type {  SQL } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

export const findAll = async (userId: number, accountId?: number, year?: number, month?: number) => {
  const conditions: SQL[] = [eq(chargesTable.userId, userId)];
  if (accountId) {
    conditions.push(eq(chargesTable.stripeAccountId, accountId));
  }
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(chargesTable.createdAt, year, month);
  conditions.push(...dateFilters);
  
  const charges = await db.select().from(chargesTable).where(and(...conditions));
  return charges;
};

export const findById = async (id: number, userId: number) => {
  const result = await db.select().from(chargesTable)
    .where(and(eq(chargesTable.id, id), eq(chargesTable.userId, userId)))
    .limit(1);
  return result[0] || null;
};

export const create = async (data: any) => {
  const result = await db.insert(chargesTable).values(data).returning();
  return result[0];
};