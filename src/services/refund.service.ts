import { db } from '../db';
import { refundsTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, or, ilike, and, count, asc, desc, gte, lte } from 'drizzle-orm';
import { dateStringToUTC } from '../utils/date.utils';

export const findAll = async (options: {
  page?: number;
  pageSize?: number;
  query?: string;
  sort?: string;
  filter?: Record<string, any>;
  userId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  currency?: string;
  reason?: string;
  accountId?: number;
  year?: number;
} = {}): Promise<{ refunds: any[], totalCount: number }> => {
  const { page = 1, pageSize = 10, query, sort, filter, userId, startDate, endDate, status, currency, reason, accountId, year } = options;
  const whereClauses: (SQL | undefined)[] = [];
  
  if (userId) {
    whereClauses.push(eq(refundsTable.userId, userId));
  }
  
  if (accountId) {
    whereClauses.push(eq(refundsTable.stripeAccountId, accountId));
  }
  
  if (startDate) {
    whereClauses.push(gte(refundsTable.createdAt, dateStringToUTC(startDate)));
  }
  
  if (endDate) {
    whereClauses.push(lte(refundsTable.createdAt, dateStringToUTC(endDate)));
  }
  
  if (year) {
    const yearNum: number = typeof year === 'string' ? +year : year;
    const startOfYear = new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));
    whereClauses.push(gte(refundsTable.createdAt, startOfYear));
    whereClauses.push(lte(refundsTable.createdAt, endOfYear));
  }
  
  if (status) {
    whereClauses.push(eq(refundsTable.status, status));
  }
  
  if (currency) {
    whereClauses.push(eq(refundsTable.currency, currency));
  }
  
  if (reason) {
    whereClauses.push(eq(refundsTable.reason, reason));
  }
  
  if (query) {
    const searchQuery = `%${query}%`;
    whereClauses.push(
      or(
        ilike(refundsTable.status, searchQuery),
        ilike(refundsTable.currency, searchQuery),
        ilike(refundsTable.reason, searchQuery)
      )
    );
  }

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (key in refundsTable) {
        whereClauses.push(eq(refundsTable[key as keyof typeof refundsTable.$inferSelect], value));
      }
    }
  }

  let orderBy: SQL | undefined;
  if (sort) {
    const [column, direction] = sort.split(':');
    const sortableColumns = {
      'amount': refundsTable.amount,
      'status': refundsTable.status,
      'currency': refundsTable.currency,
      'reason': refundsTable.reason,
      'createdAt': refundsTable.createdAt,
      'updatedAt': refundsTable.updatedAt,
    };
    
    if (sortableColumns[column as keyof typeof sortableColumns]) {
      const col = sortableColumns[column as keyof typeof sortableColumns];
      orderBy = direction === 'desc' ? desc(col) : asc(col);
    }
  }

  const finalWhereCondition = and(...whereClauses);
  
  const [refunds, total] = await Promise.all([
    db.select({
      id: refundsTable.id,
      userId: refundsTable.userId,
      stripeAccountId: refundsTable.stripeAccountId,
      stripeRefundId: refundsTable.stripeRefundId,
      stripeChargeId: refundsTable.stripeChargeId,
      amount: refundsTable.amount,
      currency: refundsTable.currency,
      status: refundsTable.status,
      reason: refundsTable.reason,
      created: refundsTable.created,
      createdAt: refundsTable.createdAt,
      updatedAt: refundsTable.updatedAt,
    })
      .from(refundsTable)
      .where(finalWhereCondition)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(orderBy || desc(refundsTable.createdAt)),
    db.select({ value: count() })
      .from(refundsTable)
      .where(finalWhereCondition)
  ]);

  return {
    refunds,
    totalCount: total[0]?.value ?? 0
  };
};
