import { db } from '../db';
import { invoiceTable, customerTable } from '../db/schema';
import type { SQL} from 'drizzle-orm';
import { eq, or, ilike, and, count, asc, desc, gte, lte } from 'drizzle-orm';
import { dateStringToUTC } from '../utils/date.utils';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

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
} = {}): Promise<{ invoices: any[], totalCount: number }> => {
  const { page = 1, pageSize = 10, query, sort, filter, userId, startDate, endDate, status, currency, customerName, accountId, year, month } = options;

  const whereClauses: (SQL | undefined)[] = [];
  
  if (userId) {
    whereClauses.push(eq(invoiceTable.userId, userId));
  }
  
  if (accountId) {
    whereClauses.push(eq(invoiceTable.stripeAccountId, accountId));
  }
  if (startDate) {
    whereClauses.push(gte(invoiceTable.createdAt, dateStringToUTC(startDate)));
  }
  if (endDate) {
    whereClauses.push(lte(invoiceTable.createdAt, dateStringToUTC(endDate)));
  }

  // Add year and month filters (if month is empty, filters all by selected year)
  const dateFilters = getDateRangeFilters(invoiceTable.createdAt, year, month);
  whereClauses.push(...dateFilters);
  
  if (status) {
    whereClauses.push(eq(invoiceTable.status, status));
  }
  
  if (currency) {
    whereClauses.push(eq(invoiceTable.currency, currency));
  }
  
  if (query) {
    const searchQuery = `%${query}%`;
    whereClauses.push(
      or(
        ilike(invoiceTable.status, searchQuery),
        ilike(invoiceTable.currency, searchQuery)
      )
    );
  }

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (key in invoiceTable) {
        whereClauses.push(eq(invoiceTable[key as keyof typeof invoiceTable.$inferSelect], value));
      }
    }
  }

  let orderBy: SQL | undefined;
  if (sort) {
    const [column, direction] = sort.split(':');
    const sortableColumns = {
      'amount': invoiceTable.amount,
      'status': invoiceTable.status,
      'currency': invoiceTable.currency,
      'createdAt': invoiceTable.createdAt,
      'updatedAt': invoiceTable.updatedAt,
      'customerName': customerTable.name,
    };
    
    if (sortableColumns[column as keyof typeof sortableColumns]) {
      const col = sortableColumns[column as keyof typeof sortableColumns];
      orderBy = direction === 'desc' ? desc(col) : asc(col);
    }
  }

  const baseQuery = db
    .select({
      id: invoiceTable.id,
      userId: invoiceTable.userId,
      stripeCustomerId: invoiceTable.stripeCustomerId,
      stripeInvoiceId: invoiceTable.stripeInvoiceId,
      amount: invoiceTable.amount,
      currency: invoiceTable.currency,
      status: invoiceTable.status,
      createdAt: invoiceTable.createdAt,
      updatedAt: invoiceTable.updatedAt,
      customerName: customerTable.name,
      customerEmail: customerTable.email,
    })
    .from(invoiceTable)
    .leftJoin(customerTable, eq(invoiceTable.stripeCustomerId, customerTable.stripeCustomerId));

  if (customerName) {
    whereClauses.push(ilike(customerTable.name, `%${customerName}%`));
  }

  const finalWhereCondition = and(...whereClauses);

  const [invoices, total] = await Promise.all([
    baseQuery
      .where(finalWhereCondition)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(orderBy || desc(invoiceTable.createdAt)),
    db.select({ value: count() })
      .from(invoiceTable)
      .leftJoin(customerTable, eq(invoiceTable.stripeCustomerId, customerTable.stripeCustomerId))
      .where(finalWhereCondition)
  ]);

  return {
    invoices,
    totalCount: total[0]?.value ?? 0
  };
};