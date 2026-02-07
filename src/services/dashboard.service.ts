import { db } from '../db';
import {
  customerTable,
  paymentIntentsTable,
  chargesTable,
} from '../db/schema';
import { eq, and, sum, sql, count } from 'drizzle-orm';

type FilterType = 'today' | 'week' | 'month' | 'year';

interface DashboardMetrics {
  totalRevenue: {
    amount: number;
    growth: number;
  };
  totalCustomers: {
    count: number;
    growth: number;
  };
  monthlyGrowth: number;
  revenueChart: {
    current: { label: string; revenue: number }[];
    previous: { label: string; revenue: number }[];
  };
  recentTransactions: any[];
  filterType: FilterType;
}

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

export const getDashboardAnalytics = async (
  userId: number, 
  accountId?: number, 
  filter: FilterType = 'year'
): Promise<DashboardMetrics> => {

  const now = new Date();

  // Determine date ranges based on filter type
  let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
  
  switch (filter) {
    case 'today':
      // Current day
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      // Previous day
      previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      break;

    case 'week':
      // Current week (last 7 days including today)
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      // Previous 4 weeks (28 days before current week)
      previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 34, 0, 0, 0);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59);
      break;

    case 'month':
      // Current month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      // Previous month
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;

    case 'year':
    default:
      // Current year
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      // Previous year
      previousStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
  }

  // Base filters
  const basePaymentFilter = accountId 
    ? and(eq(paymentIntentsTable.userId, userId), eq(paymentIntentsTable.stripeAccountId, accountId))
    : eq(paymentIntentsTable.userId, userId);
  
  const baseCustomerFilter = accountId
    ? and(eq(customerTable.userId, userId), eq(customerTable.stripeAccountId, accountId))
    : eq(customerTable.userId, userId);

  // 1. Total Revenue for current period
  const totalRevenueResult = await db
    .select({ total: sum(paymentIntentsTable.amount) })
    .from(paymentIntentsTable)
    .where(and(
      basePaymentFilter, 
      eq(paymentIntentsTable.status, 'succeeded'),
      sql`to_timestamp(${paymentIntentsTable.created}) >= ${currentStart}`,
      sql`to_timestamp(${paymentIntentsTable.created}) <= ${currentEnd}`
    ));
  const totalRevenue = Number(totalRevenueResult[0]?.total || '0');

  const previousRevenueResult = await db
    .select({ total: sum(paymentIntentsTable.amount) })
    .from(paymentIntentsTable)
    .where(and(
      basePaymentFilter,
      eq(paymentIntentsTable.status, 'succeeded'),
      sql`to_timestamp(${paymentIntentsTable.created}) >= ${previousStart}`,
      sql`to_timestamp(${paymentIntentsTable.created}) <= ${previousEnd}`
    ));
  const previousRevenue = Number(previousRevenueResult[0]?.total || '0');
  const revenueGrowth = calculateGrowth(totalRevenue, previousRevenue);

  // 2. Total Customers for current period
  const totalCustomersResult = await db
    .select({ count: count(customerTable.id) })
    .from(customerTable)
    .where(and(
      baseCustomerFilter,
      sql`to_timestamp(${customerTable.created}) >= ${currentStart}`,
      sql`to_timestamp(${customerTable.created}) <= ${currentEnd}`
    ));
  const totalCustomers = totalCustomersResult[0]?.count || 0;

  const previousCustomersResult = await db
    .select({ count: count(customerTable.id) })
    .from(customerTable)
    .where(and(
      baseCustomerFilter,
      sql`to_timestamp(${customerTable.created}) >= ${previousStart}`,
      sql`to_timestamp(${customerTable.created}) <= ${previousEnd}`
    ));
  const previousCustomers = previousCustomersResult[0]?.count || 0;
  const customerGrowth = calculateGrowth(totalCustomers, previousCustomers);

  // 3. Monthly Growth
  const monthlyGrowth = revenueGrowth;

  // 4. Revenue Chart Data based on filter
  let revenueChart: { current: { label: string; revenue: number }[]; previous: { label: string; revenue: number }[] };

  if (filter === 'today') {
    // Hourly data for today vs yesterday
    const currentHourlyData = await db
      .select({
        hour: sql<number>`extract(hour from to_timestamp(${paymentIntentsTable.created}))`,
        revenue: sum(paymentIntentsTable.amount),
      })
      .from(paymentIntentsTable)
      .where(
        and(
          basePaymentFilter,
          eq(paymentIntentsTable.status, 'succeeded'),
          sql`to_timestamp(${paymentIntentsTable.created}) >= ${currentStart}`,
          sql`to_timestamp(${paymentIntentsTable.created}) <= ${currentEnd}`
        )
      )
      .groupBy(sql`extract(hour from to_timestamp(${paymentIntentsTable.created}))`);

    const previousHourlyData = await db
      .select({
        hour: sql<number>`extract(hour from to_timestamp(${paymentIntentsTable.created}))`,
        revenue: sum(paymentIntentsTable.amount),
      })
      .from(paymentIntentsTable)
      .where(
        and(
          basePaymentFilter,
          eq(paymentIntentsTable.status, 'succeeded'),
          sql`to_timestamp(${paymentIntentsTable.created}) >= ${previousStart}`,
          sql`to_timestamp(${paymentIntentsTable.created}) <= ${previousEnd}`
        )
      )
      .groupBy(sql`extract(hour from to_timestamp(${paymentIntentsTable.created}))`);

    const formatHourlyData = (results: any[]) => {
      const hourlyRevenue = new Array(24).fill(0);
      results.forEach(r => {
        hourlyRevenue[r.hour] = Number(r.revenue || 0);
      });
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${i.toString().padStart(2, '0')}:00`,
        revenue: hourlyRevenue[i],
      }));
    };

    revenueChart = {
      current: formatHourlyData(currentHourlyData),
      previous: formatHourlyData(previousHourlyData),
    };

  } else if (filter === 'week') {
    // Weekly data - current week + previous 4 weeks shown as individual weeks
    const getDailyData = async (startDate: Date, endDate: Date) => {
      return await db
        .select({
          date: sql<string>`to_char(to_timestamp(${paymentIntentsTable.created}), 'YYYY-MM-DD')`,
          revenue: sum(paymentIntentsTable.amount),
        })
        .from(paymentIntentsTable)
        .where(
          and(
            basePaymentFilter,
            eq(paymentIntentsTable.status, 'succeeded'),
            sql`to_timestamp(${paymentIntentsTable.created}) >= ${startDate}`,
            sql`to_timestamp(${paymentIntentsTable.created}) <= ${endDate}`
          )
        )
        .groupBy(sql`to_char(to_timestamp(${paymentIntentsTable.created}), 'YYYY-MM-DD')`);
    };

    const currentWeekData = await getDailyData(currentStart, currentEnd);
    const previousWeeksData = await getDailyData(previousStart, previousEnd);

    // Sum up current week
    const currentWeekTotal = currentWeekData.reduce((sum, day) => sum + Number(day.revenue || 0), 0);
    
    // Group previous 4 weeks data
    const previousWeeks = [
      { label: 'Week -4', revenue: 0 },
      { label: 'Week -3', revenue: 0 },
      { label: 'Week -2', revenue: 0 },
      { label: 'Week -1', revenue: 0 },
    ];

    previousWeeksData.forEach(day => {
      const dayDate = new Date(day.date);
      const daysDiff = Math.floor((previousEnd.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysDiff / 7);
      if (weekIndex >= 0 && weekIndex < 4) {
        previousWeeks[3 - weekIndex]!.revenue += Number(day.revenue || 0);
      }
    });

    revenueChart = {
      current: [{ label: 'Current Week', revenue: currentWeekTotal }],
      previous: previousWeeks,
    };

  } else if (filter === 'month') {
    // Daily data for current month vs previous month
    const getCurrentMonthDays = () => {
      const year = now.getFullYear();
      const month = now.getMonth();
      return new Date(year, month + 1, 0).getDate();
    };

    const currentMonthDays = getCurrentMonthDays();

    const currentMonthData = await db
      .select({
        day: sql<number>`extract(day from to_timestamp(${paymentIntentsTable.created}))`,
        revenue: sum(paymentIntentsTable.amount),
      })
      .from(paymentIntentsTable)
      .where(
        and(
          basePaymentFilter,
          eq(paymentIntentsTable.status, 'succeeded'),
          sql`to_timestamp(${paymentIntentsTable.created}) >= ${currentStart}`,
          sql`to_timestamp(${paymentIntentsTable.created}) <= ${currentEnd}`
        )
      )
      .groupBy(sql`extract(day from to_timestamp(${paymentIntentsTable.created}))`);

    const previousMonthData = await db
      .select({
        day: sql<number>`extract(day from to_timestamp(${paymentIntentsTable.created}))`,
        revenue: sum(paymentIntentsTable.amount),
      })
      .from(paymentIntentsTable)
      .where(
        and(
          basePaymentFilter,
          eq(paymentIntentsTable.status, 'succeeded'),
          sql`to_timestamp(${paymentIntentsTable.created}) >= ${previousStart}`,
          sql`to_timestamp(${paymentIntentsTable.created}) <= ${previousEnd}`
        )
      )
      .groupBy(sql`extract(day from to_timestamp(${paymentIntentsTable.created}))`);

    const formatDailyData = (results: any[], maxDays: number) => {
      const dailyRevenue = new Array(maxDays).fill(0);
      results.forEach(r => {
        if (r.day >= 1 && r.day <= maxDays) {
          dailyRevenue[r.day - 1] = Number(r.revenue || 0);
        }
      });
      return Array.from({ length: maxDays }, (_, i) => ({
        label: `Day ${i + 1}`,
        revenue: dailyRevenue[i],
      }));
    };

    revenueChart = {
      current: formatDailyData(currentMonthData, currentMonthDays),
      previous: formatDailyData(previousMonthData, new Date(now.getFullYear(), now.getMonth(), 0).getDate()),
    };

  } else {
    // Yearly data - all 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const currentYearData = await db
      .select({
        month: sql<number>`extract(month from to_timestamp(${paymentIntentsTable.created}))`,
        revenue: sum(paymentIntentsTable.amount),
      })
      .from(paymentIntentsTable)
      .where(
        and(
          basePaymentFilter,
          eq(paymentIntentsTable.status, 'succeeded'),
          sql`to_timestamp(${paymentIntentsTable.created}) >= ${currentStart}`,
          sql`to_timestamp(${paymentIntentsTable.created}) <= ${currentEnd}`
        )
      )
      .groupBy(sql`extract(month from to_timestamp(${paymentIntentsTable.created}))`);

    const previousYearData = await db
      .select({
        month: sql<number>`extract(month from to_timestamp(${paymentIntentsTable.created}))`,
        revenue: sum(paymentIntentsTable.amount),
      })
      .from(paymentIntentsTable)
      .where(
        and(
          basePaymentFilter,
          eq(paymentIntentsTable.status, 'succeeded'),
          sql`to_timestamp(${paymentIntentsTable.created}) >= ${previousStart}`,
          sql`to_timestamp(${paymentIntentsTable.created}) <= ${previousEnd}`
        )
      )
      .groupBy(sql`extract(month from to_timestamp(${paymentIntentsTable.created}))`);

    const formatMonthlyData = (results: any[]) => {
      const monthlyRevenue = new Array(12).fill(0);
      results.forEach(r => {
        monthlyRevenue[r.month - 1] = Number(r.revenue || 0);
      });
      return monthNames.map((month, i) => ({ label: month, revenue: monthlyRevenue[i] }));
    };

    revenueChart = {
      current: formatMonthlyData(currentYearData),
      previous: formatMonthlyData(previousYearData),
    };
  }

  // 5. Recent Transactions (from both payment intents and charges)
  const recentPaymentIntents = await db
    .select({
      id: paymentIntentsTable.paymentIntentId,
      amount: paymentIntentsTable.amount,
      currency: paymentIntentsTable.currency,
      status: paymentIntentsTable.status,
      created: paymentIntentsTable.created,
      customerName: sql<string>`COALESCE(${customerTable.name}, 'Unknown Customer')`,
      type: sql<string>`'payment_intent'`,
    })
    .from(paymentIntentsTable)
    .leftJoin(customerTable, eq(paymentIntentsTable.stripeCustomerId, customerTable.stripeCustomerId))
    .where(and(
      basePaymentFilter,
      sql`to_timestamp(${paymentIntentsTable.created}) >= ${currentStart}`,
      sql`to_timestamp(${paymentIntentsTable.created}) <= ${currentEnd}`
    ))
    .orderBy(sql`${paymentIntentsTable.created} DESC`)
    .limit(5);

  const baseChargeFilter = accountId
    ? and(eq(chargesTable.userId, userId), eq(chargesTable.stripeAccountId, accountId))
    : eq(chargesTable.userId, userId);

  const recentCharges = await db
    .select({
      id: chargesTable.stripeChargeId,
      amount: chargesTable.amount,
      currency: chargesTable.currency,
      status: chargesTable.status,
      created: sql<number>`extract(epoch from ${chargesTable.createdAt})`,
      customerName: sql<string>`COALESCE(${customerTable.name}, 'Unknown Customer')`,
      type: sql<string>`'charge'`,
    })
    .from(chargesTable)
    .leftJoin(customerTable, eq(chargesTable.stripeCustomerId, customerTable.stripeCustomerId))
    .where(and(
      baseChargeFilter,
      sql`${chargesTable.createdAt} >= ${currentStart}`,
      sql`${chargesTable.createdAt} <= ${currentEnd}`
    ))
    .orderBy(sql`${chargesTable.createdAt} DESC`)
    .limit(5);

  const allTransactions = [...recentPaymentIntents, ...recentCharges]
    .sort((a, b) => (b.created || 0) - (a.created || 0))
    .slice(0, 10);

  return {
    totalRevenue: {
      amount: totalRevenue,
      growth: revenueGrowth,
    },
    totalCustomers: {
      count: totalCustomers,
      growth: customerGrowth,
    },
    monthlyGrowth,
    revenueChart,
    filterType: filter,
    recentTransactions: allTransactions.map(t => ({
      id: t.id,
      customerName: t.customerName,
      amount: t.amount,
      currency: t.currency,
      dateTime: t.created ? new Date(t.created * 1000).toISOString() : new Date().toISOString(),
      status: t.status,
      type: t.type,
    })),
  };
};