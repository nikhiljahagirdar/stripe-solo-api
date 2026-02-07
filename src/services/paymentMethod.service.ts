import { db } from '../db';
import { paymentMethodsTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

export const findAll = async (userId: number, accountId?: number, year?: number, month?: number) => {
  const conditions: SQL[] = [eq(paymentMethodsTable.userId, userId)];
  if (accountId) {
    conditions.push(eq(paymentMethodsTable.stripeAccountId, accountId));
  }
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(paymentMethodsTable.createdAt, year, month);
  conditions.push(...dateFilters);
  return await db.select().from(paymentMethodsTable).where(and(...conditions));
};

export const findById = async (id: number, userId: number) => {
  const result = await db.select().from(paymentMethodsTable)
    .where(and(eq(paymentMethodsTable.id, id), eq(paymentMethodsTable.userId, userId)))
    .limit(1);
  return result[0] || null;
};

export const create = async (data: any) => {
  const result = await db.insert(paymentMethodsTable).values(data).returning();
  return result[0];
};