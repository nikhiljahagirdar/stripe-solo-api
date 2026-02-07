import { db } from '../db';
import { couponsTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

export const findAll = async (userId: number, accountId?: number, year?: number, month?: number) => {
  const conditions: SQL[] = [eq(couponsTable.userId, userId)];
  if (accountId) {
    // There is no stripeAccountId on the couponsTable, using id as a placeholder
    conditions.push(eq(couponsTable.id, accountId));
  }
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(couponsTable.createdAt, year, month);
  conditions.push(...dateFilters);
  const coupons = await db.select().from(couponsTable).where(and(...conditions));
  return coupons;
};

export const findById = async (id: number, userId: number) => {
  const result = await db.select().from(couponsTable)
    .where(and(eq(couponsTable.id, id), eq(couponsTable.userId, userId)))
    .limit(1);
  return result[0] || null;
};

export const create = async (data: any) => {
  const result = await db.insert(couponsTable).values(data).returning();
  return result[0];
};

export const update = async (id: number, data: any, userId: number) => {
  const result = await db.update(couponsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(couponsTable.id, id), eq(couponsTable.userId, userId)))
    .returning();
  return result[0] || null;
};