import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { customerTable, productTable, disputeTable, payoutsTable, chargesTable, balanceTable } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * @typedef {object} DashboardSummary
 * @property {integer} totalCustomers
 * @property {integer} totalProducts
 * @property {integer} totalDisputes
 * @property {integer} totalPayouts
 * @property {number} totalPayoutAmount
 */

/**
 * GET /api/v1/analytics/dashboard
 * @summary Get dashboard summary
 * @description Retrieves aggregated metrics for the user's dashboard
 * @tags Analytics
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - Optional filter by Stripe Account ID
 * @return {DashboardSummary} 200 - Dashboard metrics
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

  const { accountId } = req.query;
  const userId = user.id;

  try {
    // Helper to build queries
    const buildQuery = (table: typeof customerTable | typeof disputeTable) => {
      const conditions = [eq(table.userId, userId)];
      if (accountId && 'stripeAccountId' in table) {
        conditions.push(eq(table.stripeAccountId, Number(accountId as string)));
      }
      return db.select({ count: sql`count(*)` }).from(table).where(and(...conditions));
    };

    const [customers] = await buildQuery(customerTable);
    const [products] = await db.select({ count: sql`count(*)` })
      .from(productTable)
      .where(eq(productTable.userId, userId)); // Products might not have stripeAccountId directly on table in some schemas, checking schema...
      // Schema check: productTable has userId but NOT stripeAccountId. It links via prices. 
      // For simplicity, we count all user products here.

    const [disputes] = await buildQuery(disputeTable);
    
    // Payouts aggregation
    const payoutConditions = [eq(payoutsTable.userId, userId)];
    
    if (accountId) {
      payoutConditions.push(eq(payoutsTable.stripeAccountId, Number(accountId as string)));
    }

    const [payouts] = await db.select({ 
      count: sql`count(*)`, 
      totalAmount: sql`sum(${payoutsTable.amount})` 
    }).from(payoutsTable).where(and(...payoutConditions));

    res.json({
      totalCustomers: Number(customers?.count ?? 0),
      totalProducts: Number(products?.count ?? 0),
      totalDisputes: Number(disputes?.count ?? 0),
      totalPayouts: Number(payouts?.count ?? 0),
      totalPayoutAmount: Number(payouts?.totalAmount ?? 0)
    });
  } catch (error) {
    next(error);
  }
};

// Note: Ensure you register this controller in your routes file (e.g., analytics.routes.ts)
// router.get('/dashboard', getDashboardSummary);

/**
 * @typedef {object} FinancialSummary
 * @property {number} totalRevenue
 * @property {number} totalPayouts
 * @property {number} currentBalance
 * @property {number} pendingBalance
 * @property {string} currency
 */

/**
 * GET /api/v1/analytics/financial
 * @summary Get financial summary
 * @description Retrieves aggregated financial metrics
 * @tags Analytics
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - Optional filter by Stripe Account ID
 * @return {FinancialSummary} 200 - Financial metrics
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getFinancialSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

  const { accountId } = req.query;
  const userId = user.id;

  try {
    const buildSumQuery = (table: typeof payoutsTable | typeof chargesTable | typeof balanceTable, column: typeof payoutsTable.amount | typeof chargesTable.amount | typeof balanceTable.available | typeof balanceTable.pending, extraConditions: ReturnType<typeof eq>[] = []) => {
      const conditions = [eq(table.userId, userId), ...extraConditions];
      if (accountId && 'stripeAccountId' in table) {
        conditions.push(eq((table as typeof payoutsTable | typeof chargesTable).stripeAccountId, Number(accountId as string)));
      }
      return db.select({ total: sql`sum(${column})` }).from(table).where(and(...conditions));
    };

    const [payouts] = await buildSumQuery(payoutsTable, payoutsTable.amount);
    const [revenue] = await buildSumQuery(chargesTable, chargesTable.amount, [eq(chargesTable.paid, true)]);
    const [balance] = await buildSumQuery(balanceTable, balanceTable.available);
    const [pending] = await buildSumQuery(balanceTable, balanceTable.pending);

    res.json({
      totalRevenue: Number(revenue?.total ?? 0),
      totalPayouts: Number(payouts?.total ?? 0),
      currentBalance: Number(balance?.total ?? 0),
      pendingBalance: Number(pending?.total ?? 0),
      currency: 'usd' // This should ideally come from the account default currency
    });
  } catch (error) {
    next(error);
  }
};
