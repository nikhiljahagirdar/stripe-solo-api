import { db } from '../db';
import { payoutsTable, type Payout, type NewPayout } from '../db/schema';
import { eq, and, sql, like, desc, asc, count } from 'drizzle-orm';
import { getOrCreateStripeClient } from './client.service';
import { dateStringToUTC } from '../utils/date.utils';

interface PayoutFilters {
  userId: number;
  accountId: number;
  page: number;
  pageSize: number;
  query?: string;
  sort?: string;
  startDate?: string;
  endDate?: string;
  period?: string;
  status?: string;
  currency?: string;
  type?: string;
  method?: string;
  automatic?: boolean;
  year?: number;
}

interface PaginatedPayouts {
  data: Payout[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class PayoutService {
  async findAllWithFilters(filters: PayoutFilters): Promise<PaginatedPayouts> {
    const conditions = [eq(payoutsTable.userId, filters.userId)];
    
    if (filters.accountId) {
      conditions.push(eq(payoutsTable.stripeAccountId, filters.accountId));
    }

    // Date filtering
    if (filters.period && filters.period !== 'custom') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      conditions.push(sql`${payoutsTable.createdAt} >= ${startDate}`);
    } else if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        conditions.push(sql`${payoutsTable.createdAt} >= ${dateStringToUTC(filters.startDate)}`);
      }
      if (filters.endDate) {
        const endDate = dateStringToUTC(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(sql`${payoutsTable.createdAt} <= ${endDate}`);
      }
    }

    if (filters.year) {
      const yearNum: number = typeof filters.year === 'string' ? +filters.year : filters.year;
      const startDate = new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));
      conditions.push(sql`${payoutsTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${payoutsTable.createdAt} <= ${endDate}`);
    }

    if (filters.status) {
      conditions.push(eq(payoutsTable.status, filters.status));
    }

    if (filters.currency) {
      conditions.push(eq(payoutsTable.currency, filters.currency));
    }

    if (filters.query) {
      conditions.push(like(payoutsTable.stripePayoutId, `%${filters.query}%`));
    }

    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(payoutsTable)
      .where(and(...conditions));

    const total = totalResult?.total ?? 0;

    // Apply sorting
    let orderBy;
    const [sortField, sortDirection] = (filters.sort || 'created:desc').split(':');
    const isDesc = sortDirection === 'desc';
    
    switch (sortField) {
      case 'amount':
        orderBy = isDesc ? desc(payoutsTable.amount) : asc(payoutsTable.amount);
        break;
      case 'arrivalDate':
        orderBy = isDesc ? desc(payoutsTable.arrivalDate) : asc(payoutsTable.arrivalDate);
        break;
      case 'created':
      default:
        orderBy = isDesc ? desc(payoutsTable.createdAt) : asc(payoutsTable.createdAt);
    }

    // Get paginated data
    const data = await db
      .select()
      .from(payoutsTable)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    return {
      data,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize)
      }
    };
  }

  async findAll(userId: number, accountId?: number, year?: number): Promise<Payout[]> {
    const conditions = [eq(payoutsTable.userId, userId)];
    if (accountId) {
      conditions.push(eq(payoutsTable.stripeAccountId, accountId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      conditions.push(sql`${payoutsTable.createdAt} >= ${startDate}`);
      conditions.push(sql`${payoutsTable.createdAt} <= ${endDate}`);
    }
    return db.select().from(payoutsTable).where(and(...conditions));
  }

  async findById(userId: number, id: number, accountId: number): Promise<Payout | undefined> {
    const [payout] = await db.select().from(payoutsTable)
      .where(and(eq(payoutsTable.id, id), eq(payoutsTable.userId, userId), eq(payoutsTable.stripeAccountId, accountId)))
      .limit(1);
    return payout!;
  }

  async create(userId: number, stripeAccountId: number, amount: number, currency: string): Promise<Payout> {
    const stripe = await getOrCreateStripeClient(stripeAccountId, userId);
    if (!stripe) {throw new Error('Stripe client not found');}
    
    const stripePayout = await stripe.payouts.create({
      amount,
      currency,
    });

    const newPayout: NewPayout = {
      userId,
      stripeAccountId,
      stripePayoutId: stripePayout.id,
      amount: (stripePayout.amount / 100).toString(),
      currency: stripePayout.currency,
      status: stripePayout.status,
      arrivalDate: stripePayout.arrival_date ? new Date(stripePayout.arrival_date * 1000) : null,
      created: stripePayout.created,
    };

    const [payout] = await db.insert(payoutsTable).values(newPayout).returning();
    return payout!;
  }
}
