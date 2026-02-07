import { db } from '../db';
import { sql, and, gte, lte, eq } from 'drizzle-orm';
import { createClient } from 'redis';
import { config } from '../config';

// We are assuming the existence of these tables in your schema.
// You might need to adjust the table and column names to match your actual schema.
import { chargesTable, paymentIntentsTable, customerTable } from '../db/schema';

let redisClient: any = null;

// Only initialize Redis if URL is provided
if (config.redis.url) {
  redisClient = createClient({ url: config.redis.url });
  redisClient.on('error', (err: any) => console.error('Redis Client Error', err));
}

interface RecentTransaction {
  id: number;
  amount: number;
  currency: string;
  status: string | null;
  type: 'charge' | 'payment_intent';
  customerName?: string | null;
  paymentDate: Date;
}

interface AnalyticsSummary {
  totalRevenue: number;
  netRevenue: number;
  totalCustomers: number;
  newCustomers: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  avgOrderValue: number;
  recentTransactions: RecentTransaction[];
}

/**
 * Retrieves a cached financial summary from Redis.
 * @param {number} userId - The ID of the user.
 * @param {string} period - The reporting period (e.g., 'monthly').
 * @returns {Promise<AnalyticsSummary | null>} The cached summary or null.
 */
export async function getCachedFinancialSummary(userId: number, stripeAccountId: number, period: string): Promise<AnalyticsSummary | null> {
  if (!redisClient) {return null;}
  
  try {
    if (!redisClient.isOpen) {await redisClient.connect();}
    const cacheKey = `analytics:${userId}:${stripeAccountId}:${period}`;
    const cachedData = await redisClient.get(cacheKey);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.warn('Redis cache read failed:', error);
    return null;
  }
}

/**
 * Caches a financial summary in Redis.
 * @param {number} userId - The ID of the user.
 * @param {string} period - The reporting period.
 * @param {AnalyticsSummary} data - The summary data to cache.
 * @param {number} ttl - The time-to-live for the cache in seconds.
 */
export async function setCachedFinancialSummary(userId: number, stripeAccountId: number, period: string, data: AnalyticsSummary, ttl: number = 3600): Promise<void> {
  if (!redisClient) {return;}
  
  try {
    if (!redisClient.isOpen) {await redisClient.connect();}
    const cacheKey = `analytics:${userId}:${stripeAccountId}:${period}`;
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: ttl });
  } catch (error) {
    console.warn('Redis cache write failed:', error);
  }
}

/**
 * Calculates a summary of key business metrics over a given period from the local database.
 * This function is intended to be the source of truth when the cache is empty.
 * @param {number} userId - The ID of the user to calculate metrics for.
 * @param {Date} startDate - The start of the reporting period.
 * @param {Date} endDate - The end of the reporting period.
 * @returns {Promise<AnalyticsSummary>} A summary of analytics data.
 */
export async function getFinancialSummaryFromDb(userId: number, stripeAccountId: number, startDate: Date, endDate: Date, status?: string): Promise<AnalyticsSummary> {
  const chargeFilter = and(
    eq(chargesTable.userId, userId),
    eq(chargesTable.stripeAccountId, stripeAccountId),
    gte(chargesTable.createdAt, startDate),
    lte(chargesTable.createdAt, endDate),
    ...(status ? [eq(chargesTable.status, status)] : [])
  );

  // Revenue from charges only (to avoid double counting with payment intents)
  const [chargeRevenue] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${chargesTable.status} = 'succeeded' THEN ${chargesTable.amount} ELSE 0 END), 0)::int`,
    })
    .from(chargesTable)
    .where(chargeFilter);

  const [refundData] = await db
    .select({
      totalRefunds: sql<number>`COALESCE(SUM(${chargesTable.amount}), 0)::int`,
    })
    .from(chargesTable)
    .where(
      and(eq(chargesTable.userId, userId), eq(chargesTable.stripeAccountId, stripeAccountId), eq(chargesTable.refunded, true), gte(chargesTable.createdAt, startDate), lte(chargesTable.createdAt, endDate))
    );

  const totalRevenue = chargeRevenue?.revenue ?? 0;
  const netRevenue = totalRevenue - (refundData?.totalRefunds ?? 0);

  // Customer data
  const [customerData] = await db
    .select({
      totalCustomers: sql<number>`COUNT(*)::int`,
    })
    .from(customerTable)
    .where(and(eq(customerTable.userId, userId), eq(customerTable.stripeAccountId, stripeAccountId)));

  const [newCustomerData] = await db
    .select({
      newCustomers: sql<number>`COUNT(*)::int`,
    })
    .from(customerTable)
    .where(
      and(
        eq(customerTable.userId, userId),
        eq(customerTable.stripeAccountId, stripeAccountId),
        gte(customerTable.createdAt, startDate),
        lte(customerTable.createdAt, endDate)
      )
    );

  // Payment data from charges only (to avoid double counting)
  const [chargeData] = await db
    .select({
      totalCharges: sql<number>`COUNT(*)::int`,
      successfulCharges: sql<number>`COUNT(CASE WHEN ${chargesTable.status} = 'succeeded' THEN 1 END)::int`,
      failedCharges: sql<number>`COUNT(CASE WHEN ${chargesTable.status} = 'failed' THEN 1 END)::int`,
    })
    .from(chargesTable)
    .where(chargeFilter);

  const totalPayments = chargeData!.totalCharges;
  const successfulPayments = chargeData!.successfulCharges;
  const failedPayments = chargeData!.failedCharges;
  const avgOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

  // Recent transactions from both charges and payment intents (last 10)
  const recentCharges = await db
    .select({
      id: chargesTable.id,
      amount: chargesTable.amount,
      currency: chargesTable.currency,
      status: chargesTable.status,
      customerName: customerTable.name,
      paymentDate: chargesTable.createdAt,
    })
    .from(chargesTable)
    .leftJoin(customerTable, eq(chargesTable.stripeCustomerId, customerTable.stripeCustomerId))
    .where(and(eq(chargesTable.userId, userId), eq(chargesTable.stripeAccountId, stripeAccountId)))
    .orderBy(sql`${chargesTable.createdAt} DESC`)
    .limit(5);

  const recentPaymentIntents = await db
    .select({
      id: paymentIntentsTable.id,
      amount: paymentIntentsTable.amount,
      currency: paymentIntentsTable.currency,
      status: paymentIntentsTable.status,
      customerName: customerTable.name,
      paymentDate: paymentIntentsTable.createdAt,
    })
    .from(paymentIntentsTable)
    .leftJoin(customerTable, eq(paymentIntentsTable.stripeCustomerId, customerTable.stripeCustomerId))
    .where(and(eq(paymentIntentsTable.userId, userId), eq(paymentIntentsTable.stripeAccountId, stripeAccountId)))
    .orderBy(sql`${paymentIntentsTable.createdAt} DESC`)
    .limit(5);

  const recentTransactions: RecentTransaction[] = [
    ...recentCharges.map(c => ({ ...c, amount: parseFloat(c.amount || '0'), type: 'charge' as const, status: c.status || 'unknown' })),
    ...recentPaymentIntents.map(p => ({ ...p, amount: parseFloat(p.amount || '0'), type: 'payment_intent' as const, status: p.status || 'unknown' }))
  ].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).slice(0, 10);

  return {
    totalRevenue,
    netRevenue,
    totalCustomers: customerData?.totalCustomers ?? 0,
    newCustomers: newCustomerData?.newCustomers ?? 0,
    totalPayments,
    successfulPayments,
    failedPayments,
    avgOrderValue,
    recentTransactions,
  };
}

// Helper function to get the start of a specific year
export function getStartOfYear(year?: number): Date {
  const targetYear = year || new Date().getFullYear();
  return new Date(targetYear, 0, 1);
}

// Helper function to get the end of a specific year
export function getEndOfYear(year?: number): Date {
  const targetYear = year || new Date().getFullYear();
  return new Date(targetYear, 11, 31, 23, 59, 59, 999);
}

// Helper function to get the start of the current month
export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Helper function to get the end of the current month
export function getEndOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

// Example of how you might use this in a controller
/*
  let summary = await getCachedFinancialSummary(userId, 'monthly');
  if (!summary) {
    summary = await getFinancialSummaryFromDb(userId, getStartOfMonth(), new Date());
    await setCachedFinancialSummary(userId, 'monthly', summary);
  }
  res.status(200).json(summary);
*/