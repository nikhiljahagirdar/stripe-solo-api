import type { Request, Response, NextFunction } from 'express';
import { getDashboardAnalytics } from '../services/dashboard.service';
import { getEffectiveUserId } from '../utils/user.utils';

/**
 * @typedef {object} DashboardAnalytics
 * @property {object} totalRevenue - Total revenue information.
 * @property {number} totalRevenue.amount - The total revenue.
 * @property {number} totalRevenue.growth - The growth percentage from comparison period.
 * @property {object} totalCustomers - Total customer information.
 * @property {number} totalCustomers.count - The total number of customers.
 * @property {number} totalCustomers.growth - The growth percentage from comparison period.
 * @property {number} monthlyGrowth - The monthly revenue growth percentage.
 * @property {object} revenueChart - Revenue chart data for current and comparison periods.
 * @property {object[]} revenueChart.current - Revenue data for current period.
 * @property {string} revenueChart.current.label - The time label (hour/day/week/month).
 * @property {number} revenueChart.current.revenue - The revenue for the period.
 * @property {object[]} revenueChart.previous - Revenue data for comparison period.
 * @property {string} revenueChart.previous.label - The time label (hour/day/week/month).
 * @property {number} revenueChart.previous.revenue - The revenue for the period.
 * @property {string} filterType - The filter type applied (today/week/month/year).
 * @property {object[]} recentTransactions - An array of recent transaction objects.
 */

/**
 * GET /api/v1/dashboard
 * @summary Get comprehensive dashboard analytics with flexible time filters
 * @description Retrieves dashboard analytics with support for today (hourly), week (4 weeks), month (daily), or year (monthly) views with comparison data
 * @tags Dashboard
 * @security BearerAuth
 * @param {string} filter.query - Time filter: 'today' (hourly with yesterday), 'week' (current + 3 previous weeks), 'month' (daily with prev month), 'year' (all months with prev year) - default: year
 * @param {integer} accountId.query - Optional Stripe account ID to filter data
 * @return {DashboardAnalytics} 200 - Dashboard analytics data
 * @example response - 200 - Year filter response
 * {
 *   "totalRevenue": {
 *     "amount": 45231.89,
 *     "growth": 20.1
 *   },
 *   "totalCustomers": {
 *     "count": 12234,
 *     "growth": 19
 *   },
 *   "monthlyGrowth": 24.5,
 *   "filterType": "year",
 *   "revenueChart": {
 *     "current": [
 *       { "label": "Jan", "revenue": 3000 },
 *       { "label": "Feb", "revenue": 4500 }
 *     ],
 *     "previous": [
 *       { "label": "Jan", "revenue": 2500 },
 *       { "label": "Feb", "revenue": 3800 }
 *     ]
 *   },
 *   "recentTransactions": [
 *     {
 *       "id": "pi_1234567890",
 *       "customerName": "John Doe",
 *       "amount": 29.99,
 *       "currency": "usd",
 *       "dateTime": "2025-10-26T10:00:00.000Z",
 *       "status": "succeeded",
 *       "type": "payment_intent"
 *     }
 *   ]
 * }
 * @example response - 200 - Today filter response (hourly)
 * {
 *   "filterType": "today",
 *   "revenueChart": {
 *     "current": [
 *       { "label": "00:00", "revenue": 120 },
 *       { "label": "01:00", "revenue": 80 }
 *     ],
 *     "previous": [
 *       { "label": "00:00", "revenue": 100 },
 *       { "label": "01:00", "revenue": 90 }
 *     ]
 *   }
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @example response - 401 - Unauthorized
 * {
 *   "error": "Unauthorized: User ID not found."
 * }
 * @return {object} 500 - Internal Server Error
 */
export const getDashboardData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = await getEffectiveUserId(req);
  const { accountId, filter } = req.query;
  
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  // Validate filter parameter
  const validFilters = ['today', 'week', 'month', 'year'];
  const filterType = filter && typeof filter === 'string' && validFilters.includes(filter.toLowerCase()) 
    ? filter.toLowerCase() as 'today' | 'week' | 'month' | 'year'
    : 'year';

  try {
    const dashboardData = await getDashboardAnalytics(
      userId, 
      accountId ? Number(accountId as string) : undefined,
      filterType
    );
    res.status(200).json(dashboardData);
  } catch (error) {
    next(error);
  }
};
