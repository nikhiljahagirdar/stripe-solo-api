import { db } from '../db';
import { subscriptionTable, customerTable, priceTable, productTable, type Subscription, type NewSubscription } from '../db/schema';
import type { SQL } from 'drizzle-orm';
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
  customerName?: string;
  priceId?: string;
  interval?: string;
  quantity?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  accountId?: number;
  year?: number;
  month?: number;
} = {}): Promise<{ subscriptions: any[], totalCount: number }> => {
  const { 
    page = 1, 
    pageSize = 10, 
    query, 
    sort, 
    filter, 
    userId, 
    startDate, 
    endDate, 
    status, 
    customerName, 
    priceId, 
    interval, 
    quantity,
    currentPeriodStart,
    currentPeriodEnd,
    accountId, 
    year, 
    month 
  } = options;

  const whereClauses: (SQL | undefined)[] = [];
  
  if (userId) {
    whereClauses.push(eq(subscriptionTable.userId, userId));
  }
  
  if (accountId) {
    whereClauses.push(eq(subscriptionTable.stripeAccountId, accountId));
  }
  
  if (startDate) {
    whereClauses.push(gte(subscriptionTable.createdAt, dateStringToUTC(startDate)));
  }
  
  if (endDate) {
    whereClauses.push(lte(subscriptionTable.createdAt, dateStringToUTC(endDate)));
  }

  // Add year and month filters
  const dateFilters = getDateRangeFilters(subscriptionTable.createdAt, year, month);
  whereClauses.push(...dateFilters);
  
  if (status) {
    whereClauses.push(eq(subscriptionTable.status, status));
  }
  
  if (priceId) {
    whereClauses.push(eq(subscriptionTable.stripePriceId, priceId));
  }
  
  if (interval) {
    whereClauses.push(eq(priceTable.recurringInterval, interval));
  }
  
  if (quantity) {
    whereClauses.push(eq(subscriptionTable.quantity, quantity));
  }
  
  if (currentPeriodStart) {
    whereClauses.push(gte(subscriptionTable.currentPeriodStart, dateStringToUTC(currentPeriodStart)));
  }
  
  if (currentPeriodEnd) {
    whereClauses.push(lte(subscriptionTable.currentPeriodEnd, dateStringToUTC(currentPeriodEnd)));
  }
  
  if (query) {
    const searchQuery = `%${query}%`;
    whereClauses.push(
      or(
        ilike(subscriptionTable.status, searchQuery),
        ilike(customerTable.name, searchQuery),
        ilike(customerTable.email, searchQuery)
      )
    );
  }

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (key in subscriptionTable) {
        whereClauses.push(eq(subscriptionTable[key as keyof typeof subscriptionTable.$inferSelect], value));
      }
    }
  }

  let orderBy: SQL | undefined;
  if (sort) {
    const [column, direction] = sort.split(':');
    const sortableColumns = {
      'status': subscriptionTable.status,
      'quantity': subscriptionTable.quantity,
      'createdAt': subscriptionTable.createdAt,
      'updatedAt': subscriptionTable.updatedAt,
      'currentPeriodStart': subscriptionTable.currentPeriodStart,
      'currentPeriodEnd': subscriptionTable.currentPeriodEnd,
      'customerName': customerTable.name,
    };
    
    if (sortableColumns[column as keyof typeof sortableColumns]) {
      const col = sortableColumns[column as keyof typeof sortableColumns];
      orderBy = direction === 'desc' ? desc(col) : asc(col);
    }
  }

  const baseQuery = db
    .select({
      id: subscriptionTable.id,
      userId: subscriptionTable.userId,
      stripeAccountId: subscriptionTable.stripeAccountId,
      stripeCustomerId: subscriptionTable.stripeCustomerId,
      stripeSubscriptionId: subscriptionTable.stripeSubscriptionId,
      stripePriceId: subscriptionTable.stripePriceId,
      status: subscriptionTable.status,
      currentPeriodStart: subscriptionTable.currentPeriodStart,
      currentPeriodEnd: subscriptionTable.currentPeriodEnd,
      quantity: subscriptionTable.quantity,
      createdAt: subscriptionTable.createdAt,
      updatedAt: subscriptionTable.updatedAt,
      customerName: customerTable.name,
      customerEmail: customerTable.email,
      priceId: priceTable.stripePriceId,
      interval: priceTable.recurringInterval,
      productName: productTable.name,
    })
    .from(subscriptionTable)
    .leftJoin(customerTable, eq(subscriptionTable.stripeCustomerId, customerTable.stripeCustomerId))
    .leftJoin(priceTable, eq(subscriptionTable.stripePriceId, priceTable.stripePriceId))
    .leftJoin(productTable, eq(priceTable.stripeProductId, productTable.stripeProductId));

  if (customerName) {
    whereClauses.push(ilike(customerTable.name, `%${customerName}%`));
  }

  const finalWhereCondition = and(...whereClauses);

  const [subscriptions, total] = await Promise.all([
    baseQuery
      .where(finalWhereCondition)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(orderBy || desc(subscriptionTable.createdAt)),
    db.select({ value: count() })
      .from(subscriptionTable)
      .leftJoin(customerTable, eq(subscriptionTable.stripeCustomerId, customerTable.stripeCustomerId))
      .leftJoin(priceTable, eq(subscriptionTable.stripePriceId, priceTable.stripePriceId))
      .leftJoin(productTable, eq(priceTable.stripeProductId, productTable.stripeProductId))
      .where(finalWhereCondition)
  ]);

  return {
    subscriptions,
    totalCount: total[0]?.value ?? 0
  };
};

export const findByStripeId = async (stripeSubscriptionId: string, userId?: number): Promise<Subscription | undefined> => {
  const whereClauses = [eq(subscriptionTable.stripeSubscriptionId, stripeSubscriptionId)];
  
  if (userId) {
    whereClauses.push(eq(subscriptionTable.userId, userId));
  }
  
  const [subscription] = await db
    .select()
    .from(subscriptionTable)
    .where(and(...whereClauses))
    .limit(1);
    
  return subscription;
};

export const findByCustomerId = async (stripeCustomerId: string, userId?: number): Promise<Subscription[]> => {
  const whereClauses = [eq(subscriptionTable.stripeCustomerId, stripeCustomerId)];
  
  if (userId) {
    whereClauses.push(eq(subscriptionTable.userId, userId));
  }
  
  return db
    .select()
    .from(subscriptionTable)
    .where(and(...whereClauses));
};

export const create = async (subscriptionData: {
  userId: number;
  stripeAccountId: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  quantity?: number;
}): Promise<Subscription> => {
  const newSubscription: NewSubscription = {
    userId: subscriptionData.userId,
    stripeAccountId: subscriptionData.stripeAccountId,
    stripeCustomerId: subscriptionData.stripeCustomerId,
    stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
    stripePriceId: subscriptionData.stripePriceId,
    status: subscriptionData.status,
    currentPeriodStart: subscriptionData.currentPeriodStart,
    currentPeriodEnd: subscriptionData.currentPeriodEnd,
    quantity: subscriptionData.quantity || 1,
  };

  const [subscription] = await db
    .insert(subscriptionTable)
    .values(newSubscription)
    .returning();
    
  return subscription!;
};

export const updateStatus = async (
  stripeSubscriptionId: string,
  status: string,
  userId?: number
): Promise<Subscription | undefined> => {
  const whereClauses = [eq(subscriptionTable.stripeSubscriptionId, stripeSubscriptionId)];
  
  if (userId) {
    whereClauses.push(eq(subscriptionTable.userId, userId));
  }
  
  const [updated] = await db
    .update(subscriptionTable)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(and(...whereClauses))
    .returning();
    
  return updated;
};

export const update = async (
  stripeSubscriptionId: string,
  updateData: {
    stripePriceId?: string;
    status?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    quantity?: number;
  },
  userId?: number
): Promise<Subscription | undefined> => {
  const whereClauses = [eq(subscriptionTable.stripeSubscriptionId, stripeSubscriptionId)];
  
  if (userId) {
    whereClauses.push(eq(subscriptionTable.userId, userId));
  }
  
  const [updated] = await db
    .update(subscriptionTable)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(and(...whereClauses))
    .returning();
    
  return updated;
};
