import type { Request, Response, NextFunction } from 'express';
import { findAll as findAllRefunds } from '../services/refund.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { db } from '../db';
import { refundsTable } from '../db/schema';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Refund creation request object.
 * @typedef {object} CreateRefundRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {string} chargeId.required - ID of the charge to refund
 * @property {number} amount - Amount to refund in cents (optional, defaults to full charge amount)
 * @property {string} reason - Reason for the refund (duplicate, fraudulent, requested_by_customer)
 * @property {boolean} refund_application_fee - Whether to refund the application fee
 * @property {boolean} reverse_transfer - Whether to reverse the transfer
 * @property {object} metadata - Set of key-value pairs for metadata
 */

/**
 * Stripe refund object.
 * @typedef {object} StripeRefund
 * @property {string} id - Unique identifier for the refund
 * @property {number} amount - Amount refunded in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} status - Status of the refund (pending, succeeded, failed, canceled)
 * @property {string} charge - ID of the charge that was refunded
 * @property {string} reason - Reason for the refund
 * @property {number} created - Time at which the refund was created
 * @property {object} metadata - Set of key-value pairs attached to the object
 * @property {string} receipt_number - Receipt number for the refund
 * @property {string} failure_reason - Reason for refund failure (if applicable)
 */

/**
 * GET /api/v1/refunds
 * @summary List all refunds for the authenticated user
 * @description Retrieves a list of all refunds created by the user across their Stripe accounts
 * @tags Refunds
 * @security BearerAuth
 * @param {integer} limit.query - Number of refunds to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination (refund ID)
 * @param {string} ending_before.query - Cursor for pagination (refund ID)
 * @param {string} charge.query - Filter by charge ID
 * @param {string} status.query - Filter by refund status
 * @param {number} [accountId] accountId.query - An account ID to filter refunds.
 * @param {number} [year] year.query - A year to filter refunds by creation date.
 * @return {object} 200 - List of refunds
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "re_1234567890",
 *       "amount": 1000,
 *       "currency": "usd",
 *       "status": "succeeded",
 *       "charge": "ch_1234567890",
 *       "reason": "requested_by_customer",
 *       "created": 1635724800,
 *       "receipt_number": "1234-5678"
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listRefunds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const { page, pageSize, query, sort, filter, startDate, endDate, period, status, currency, reason, accountId, year } = req.query;
  const userId = user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const pageNum = page ? +(page as string) : 1;
    const pageSizeNum = pageSize ? +(pageSize as string) : 10;

    let effectiveStartDate: string | undefined = (startDate as string) || '';
    let effectiveEndDate: string | undefined = (endDate as string) || '';
    
    if (period && !startDate && !endDate) {
      const now = new Date();
      const periodMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      
      if (periodMap[period as string]!) {
        const daysAgo = new Date(now.getTime() - (periodMap[period as string]! * 24 * 60 * 60 * 1000));
        effectiveStartDate = daysAgo.toISOString().split('T')[0];
        effectiveEndDate = now.toISOString().split('T')[0];
      }
    }

    const { refunds, totalCount } = await findAllRefunds({
      page: pageNum,
      pageSize: pageSizeNum,
      query: query as string | undefined,
      sort: sort as string | undefined,
      filter: filter as Record<string, string> | undefined,
      userId: userId,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      status: status as string | undefined,
      currency: currency as string | undefined,
      reason: reason as string | undefined,
      accountId: accountId ? Number(accountId as string) : undefined,
      year: year ? Number(year as string) : undefined,
    });

    const totalPages = Math.ceil(totalCount / pageSizeNum);
    res.status(200).json({ 
      data: refunds, 
      totalCount, 
      totalRecords: totalCount,
      totalPages,
      currentPage: pageNum,
      pageSize: pageSizeNum
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/refunds
 * @summary Create a refund for a charge
 * @description Creates a refund for a previously created charge. You can refund the entire charge or a partial amount.
 * @tags Refunds
 * @security BearerAuth
 * @param {CreateRefundRequest} request.body.required - Refund creation data
 * @example request - Request body example
 * {
 *   "accountId": 1,
 *   "chargeId": "ch_1234567890",
 *   "amount": 1000,
 *   "reason": "requested_by_customer",
 *   "metadata": {
 *     "order_id": "12345",
 *     "refund_reason": "Customer not satisfied"
 *   }
 * }
 * @return {StripeRefund} 201 - Refund created successfully
 * @example response - 201 - Success response
 * {
 *   "id": "re_1234567890",
 *   "amount": 1000,
 *   "currency": "usd",
 *   "status": "succeeded",
 *   "charge": "ch_1234567890",
 *   "reason": "requested_by_customer",
 *   "created": 1635724800,
 *   "receipt_number": "1234-5678",
 *   "metadata": {
 *     "order_id": "12345",
 *     "refund_reason": "Customer not satisfied"
 *   }
 * }
 * @return {object} 400 - Bad Request - Invalid refund data
 * @example response - 400 - Invalid data
 * {
 *   "error": "Charge has already been fully refunded"
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account or charge not found
 * @return {object} 500 - Internal Server Error
 */
export const createRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId, chargeId, amount, reason } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient(accountId, user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    const refund = await stripe.refunds.create({ charge: chargeId, amount, reason });
    // Store refund in database
    const [dbRefund] = await db.insert(refundsTable).values({
      userId: user.id,
      stripeAccountId: accountId,
      stripeRefundId: refund.id,
      stripeChargeId: chargeId,
      amount: (refund.amount / 100).toString(),
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason
    }).returning();

    res.json(dbRefund);
  } catch (error) {
    next(error);
  }
};
