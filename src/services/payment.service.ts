import { db } from '../db';
import { paymentIntentsTable, customerTable } from '../db/schema';
import type { SQL} from 'drizzle-orm';
import { eq, or, ilike, and, count, asc, desc, gte, lte } from 'drizzle-orm';
import { dateStringToUTC } from '../utils/date.utils';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

/**
 * Finds all payment intents with pagination, search, sorting, and filtering.
 * @param options - Options for pagination, search, sorting, and filtering.
 * @returns A promise that resolves to an object containing the payment intents for the page and the total count.
 */
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
  customerName?: string;
  accountId?: number;
  year?: number;
  month?: number;
} = {}): Promise<{ paymentIntents: any[], totalCount: number }> => {
  const { page = 1, pageSize = 10, query, sort, filter, userId, startDate, endDate, status, currency, customerName, accountId, year, month } = options;

  // Build the where clause dynamically
  const whereClauses: (SQL | undefined)[] = [];
  
  // Always filter by userId if provided
  if (userId) {
    whereClauses.push(eq(paymentIntentsTable.userId, userId));
  }
  
  // Account filtering
  if (accountId) {
    whereClauses.push(eq(paymentIntentsTable.stripeAccountId, accountId));
  }
  
  // Date range filtering
  if (startDate) {
    whereClauses.push(gte(paymentIntentsTable.createdAt, dateStringToUTC(startDate)));
  }
  if (endDate) {
    whereClauses.push(lte(paymentIntentsTable.createdAt, dateStringToUTC(endDate)));
  }
  
  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(paymentIntentsTable.createdAt, year, month);
  whereClauses.push(...dateFilters);
  
  // Status filtering
  if (status) {
    whereClauses.push(eq(paymentIntentsTable.status, status));
  }
  
  // Currency filtering
  if (currency) {
    whereClauses.push(eq(paymentIntentsTable.currency, currency));
  }
  
  // General search query
  if (query) {
    const searchQuery = `%${query}%`;
    whereClauses.push(
      or(
        ilike(paymentIntentsTable.status, searchQuery),
        ilike(paymentIntentsTable.currency, searchQuery)
      )
    );
  }

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (key in paymentIntentsTable) {
        whereClauses.push(eq(paymentIntentsTable[key as keyof typeof paymentIntentsTable.$inferSelect], value));
      }
    }
  }

  // Build the order by clause
  let orderBy: SQL | undefined;
  if (sort) {
    const [column, direction] = sort.split(':');
    const sortableColumns = {
      'amount': paymentIntentsTable.amount,
      'status': paymentIntentsTable.status,
      'currency': paymentIntentsTable.currency,
      'createdAt': paymentIntentsTable.createdAt,
      'updatedAt': paymentIntentsTable.updatedAt,
      'customerName': customerTable.name,
    };
    
    if (sortableColumns[column as keyof typeof sortableColumns]) {
      const col = sortableColumns[column as keyof typeof sortableColumns];
      orderBy = direction === 'desc' ? desc(col) : asc(col);
    }
  }

  // Build query with customer join for customer name filtering
  const baseQuery = db
    .select({
      id: paymentIntentsTable.id,
      userId: paymentIntentsTable.userId,
      stripeAccountId: paymentIntentsTable.stripeAccountId,
      stripeCustomerId: paymentIntentsTable.stripeCustomerId,
      paymentIntentId: paymentIntentsTable.paymentIntentId,
      amount: paymentIntentsTable.amount,
      currency: paymentIntentsTable.currency,
      status: paymentIntentsTable.status,
      livemode: paymentIntentsTable.livemode,
      created: paymentIntentsTable.created,
      createdAt: paymentIntentsTable.createdAt,
      updatedAt: paymentIntentsTable.updatedAt,
      customerName: customerTable.name,
      customerEmail: customerTable.email,
    })
    .from(paymentIntentsTable)
    .leftJoin(customerTable, eq(paymentIntentsTable.stripeCustomerId, customerTable.stripeCustomerId));

  // Add customer name filtering if provided
  if (customerName) {
    whereClauses.push(ilike(customerTable.name, `%${customerName}%`));
  }

  const finalWhereCondition = and(...whereClauses);

  // Perform two queries: one for the data page, one for the total count
  const [paymentIntents, total] = await Promise.all([
    baseQuery
      .where(finalWhereCondition)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(orderBy || desc(paymentIntentsTable.createdAt)),
    db.select({ value: count() })
      .from(paymentIntentsTable)
      .leftJoin(customerTable, eq(paymentIntentsTable.stripeCustomerId, customerTable.stripeCustomerId))
      .where(finalWhereCondition)
  ]);

  return {
    paymentIntents,
    totalCount: total[0]?.value ?? 0
  };
};
