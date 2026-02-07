import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { disputeTable, customerTable } from '../db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, sql, and } from 'drizzle-orm';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';
import { getDateRangeFilters } from '../utils/dateFilter.utils';

/**
 * @typedef {object} LocalDispute
 * @property {integer} id
 * @property {integer} userId
 * @property {integer} stripeAccountId
 * @property {string} stripeDisputeId
 * @property {number} amount
 * @property {string} currency
 * @property {string} reason
 * @property {string} status
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {object} DisputePagination
 * @property {integer} page
 * @property {integer} pageSize
 * @property {integer} total
 * @property {integer} totalPages
 */

/**
 * @typedef {object} DisputeListResponse
 * @property {array<LocalDispute>} data
 * @property {DisputePagination} pagination
 */

/**
 * GET /api/v1/disputes
 * @summary Get paginated disputes
 * @description Retrieves a paginated list of disputes for the authenticated user
 * @tags Disputes
 * @security BearerAuth
 * @param {integer} page.query - Page number (default: 1)
 * @param {integer} pageSize.query - Number of items per page (default: 50, max: 100)
 * @param {integer} accountId.query - Filter by specific account ID
 * @param {integer} year.query - Filter by specific year
 * @param {integer} month.query - Filter by specific month (1-12). If omitted, filters entire year
 * @return {DisputeListResponse} 200 - Paginated disputes response
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getDisputes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const userId = user?.id;
  const userRole = user?.role;
  const { page = 1, pageSize = 50, accountId, year, month } = req.query;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const limit = Math.min(Number(pageSize as string) || 50, 100);
    const offset = (Number(page as string) - 1) * limit;

    const conditions: SQL[] = [eq(disputeTable.userId, userId)];
    
    if (accountId) {
      conditions.push(eq(disputeTable.stripeAccountId, Number(accountId as string)));
    }
    
    // Add year and month filters (if month is empty, filters all by selected year)
    const dateFilters = getDateRangeFilters(disputeTable.created_at, year as string, month as string);
    conditions.push(...dateFilters);

    const whereClause = and(...conditions);
    const disputes = await db.select().from(disputeTable).where(whereClause).limit(limit).offset(offset);
    const totalCount = await db.select({ count: sql`count(*)` }).from(disputeTable).where(whereClause);
    const total = totalCount[0]?.count ? Number(String(totalCount[0].count)) : 0;

    res.status(200).json({
      data: disputes.map(dispute => ({
        ...dispute,
        amount: Number(dispute.amount || '0')
      })),
      pagination: {
        page: Number(page as string),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispute insights response object.
 * @typedef {object} DisputeInsights
 * @property {string} message - Response message
 * @property {array} disputes - Array of dispute objects
 * @property {object} summary - Dispute summary statistics
 * @property {number} summary.total - Total number of disputes
 * @property {number} summary.won - Number of disputes won
 * @property {number} summary.lost - Number of disputes lost
 * @property {number} summary.pending - Number of pending disputes
 * @property {number} summary.totalAmount - Total disputed amount
 */

/**
 * Stripe dispute object.
 * @typedef {object} StripeDispute
 * @property {string} id - Unique identifier for the dispute
 * @property {number} amount - Disputed amount in cents
 * @property {string} currency - Three-letter ISO currency code
 * @property {string} reason - Reason for the dispute
 * @property {string} status - Current status of the dispute
 * @property {string} charge - ID of the charge that was disputed
 * @property {number} created - Time at which the dispute was created
 * @property {object} evidence - Evidence submitted for the dispute
 * @property {object} evidence_details - Information about evidence submission deadlines
 * @property {object} metadata - Set of key-value pairs attached to the object
 * @property {boolean} is_charge_refundable - Whether the charge can be refunded
 * @property {boolean} livemode - Whether this is a live or test dispute
 */

/**
 * GET /api/v1/disputes/{accountId}/insights
 * @summary Get dispute insights and analytics for a Stripe account
 * @description Retrieves comprehensive dispute data including statistics, trends, and individual dispute details for analysis
 * @tags Disputes
 * @security BearerAuth
 * @param {integer} accountId.path.required - Stripe account ID
 * @param {integer} limit.query - Number of disputes to return (default: 10, max: 100)
 * @param {string} startingAfter.query - Cursor for pagination (dispute ID)
 * @param {string} endingBefore.query - Cursor for pagination (dispute ID)
 * @return {array<StripeDispute>} 200 - List of Stripe dispute objects
 * @example response - 200 - Success response
 * [
 *   {
 *     "id": "dp_1234567890",
 *     "object": "dispute",
 *     "amount": 2000,
 *     "currency": "usd",
 *     "reason": "fraudulent",
 *     "status": "needs_response",
 *     "charge": "ch_1234567890",
 *     "created": 1635724800,
 *     "is_charge_refundable": true,
 *     "livemode": false
 *   }
 * ]
 * @return {object} 400 - Bad Request - Account ID is required
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const getDisputeInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const userId = user?.id;
  const userRole = user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  const accountId = String(req.params['accountId'] || '');
  if (!accountId || accountId === 'undefined' || accountId === 'null') {
    res.status(400).json({ error: 'Account ID is required.' }); return;
  }

  const limit = req.query['limit'] ? String(req.query['limit']) : undefined;
  const startingAfter = req.query['startingAfter'] ? String(req.query['startingAfter']) : undefined;
  const endingBefore = req.query['endingBefore'] ? String(req.query['endingBefore']) : undefined;

  try {
    const stripe = await getOrCreateStripeClient(accountId, userId);
    if (!stripe) {
      res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
    }

    // Fetch disputes from Stripe
    const disputes = await stripe.disputes.list({
      limit: limit ? Number(limit) : 10,
      starting_after: startingAfter,
      ending_before: endingBefore,
    });

    // Get user's customers to filter disputes
    const userCustomers = await db.select().from(customerTable).where(eq(customerTable.userId, userId));
    const customerStripeIds = new Set(userCustomers.map(c => c.stripeCustomerId));

    // Filter disputes that belong to user's customers
    const relevantDisputes = await Promise.all(
      disputes.data.map(async (dispute) => {
        // If charge is expanded, check directly
        if (dispute.charge && typeof dispute.charge === 'object' && dispute.charge.customer) {
          const customerId = typeof dispute.charge.customer === 'string' 
            ? dispute.charge.customer 
            : dispute.charge.customer.id;
          if (customerStripeIds.has(customerId)) {
            return dispute;
          }
        }
        // If charge is just an ID, fetch it to check customer
        else if (typeof dispute.charge === 'string') {
          try {
            const charge = await stripe.charges.retrieve(dispute.charge);
            const customerId = typeof charge.customer === 'string' 
              ? charge.customer 
              : charge.customer?.id;
            if (customerId && customerStripeIds.has(customerId)) {
              return dispute;
            }
          } catch (err) {
            // Skip disputes we can't verify
            return null;
          }
        }
        return null;
      })
    );

    const filteredDisputes = relevantDisputes.filter(d => d !== null);

    res.status(200).json(filteredDisputes);
  } catch (error) {
    next(error);
  }
};


/**
 * Dispute evidence submission request.
 * @typedef {object} DisputeEvidenceRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {object} evidence.required - Evidence object
 * @property {string} evidence.customer_communication - Communication with the customer
 * @property {string} evidence.receipt - Receipt or proof of purchase
 * @property {string} evidence.shipping_documentation - Shipping documentation
 * @property {string} evidence.duplicate_charge_documentation - Documentation for duplicate charge
 * @property {string} evidence.refund_policy - Refund policy
 * @property {string} evidence.cancellation_policy - Cancellation policy
 * @property {string} evidence.customer_signature - Customer signature
 * @property {string} evidence.uncategorized_text - Additional evidence text
 */

/**
 * PUT /api/v1/disputes/{disputeId}/evidence
 * @summary Submit evidence for a dispute
 * @description Submits evidence to respond to a dispute. This is used to contest the dispute with supporting documentation.
 * @tags Disputes
 * @security BearerAuth
 * @param {string} disputeId.path.required - Dispute ID to submit evidence for
 * @param {DisputeEvidenceRequest} request.body.required - Evidence submission data
 * @example request - Request body example
 * {
 *   "accountId": 1,
 *   "evidence": {
 *     "customer_communication": "Email thread showing customer satisfaction",
 *     "receipt": "Receipt showing successful transaction",
 *     "shipping_documentation": "Tracking number and delivery confirmation",
 *     "uncategorized_text": "Additional context about the transaction"
 *   }
 * }
 * @return {StripeDispute} 200 - Evidence submitted successfully
 * @example response - 200 - Success response
 * {
 *   "id": "dp_1234567890",
 *   "amount": 2000,
 *   "currency": "usd",
 *   "reason": "fraudulent",
 *   "status": "under_review",
 *   "charge": "ch_1234567890",
 *   "evidence": {
 *     "customer_communication": "Email thread showing customer satisfaction",
 *     "receipt": "Receipt showing successful transaction",
 *     "submission_count": 1
 *   },
 *   "created": 1635724800
 * }
 * @return {object} 400 - Bad Request - Account ID is required
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 403 - Forbidden - Access denied to this dispute
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const submitDisputeEvidence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const disputeId = String(req.params['disputeId']);
  const { accountId, evidence } = req.body;
  const userId = user?.id;
  const userRole = user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  if (!accountId) {
    res.status(400).json({ error: 'Account ID is required.' }); return;
  }

  try {
    const stripe = await getOrCreateStripeClient(accountId, userId);
    if (!stripe) {
      res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
    }

    const disputeRecord = await db.select().from(disputeTable).where(eq(disputeTable.stripeDisputeId, disputeId)).limit(1);
    if (disputeRecord.length === 0 || disputeRecord[0]!.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this dispute.' }); return;
    }

    const updatedDispute = await stripe.disputes.update(disputeId, {
      evidence,
    });

    // Update local database status if needed
    await db.update(disputeTable)
      .set({ status: updatedDispute.status, updated_at: new Date() })
      .where(eq(disputeTable.stripeDisputeId, disputeId));

    res.status(200).json(updatedDispute);
  } catch (error) {
    next(error);
  }
};


/**
 * Close dispute request.
 * @typedef {object} CloseDisputeRequest
 * @property {integer} accountId.required - Stripe account ID
 */

/**
 * POST /api/v1/disputes/{disputeId}/close
 * @summary Close a dispute
 * @description Closes a dispute, indicating that you do not wish to contest it. Once closed, the dispute cannot be reopened.
 * @tags Disputes
 * @security BearerAuth
 * @param {string} disputeId.path.required - Dispute ID to close
 * @param {CloseDisputeRequest} request.body.required - Close dispute data
 * @example request - Request body example
 * {
 *   "accountId": 1
 * }
 * @return {StripeDispute} 200 - Dispute closed successfully
 * @example response - 200 - Success response
 * {
 *   "id": "dp_1234567890",
 *   "amount": 2000,
 *   "currency": "usd",
 *   "reason": "fraudulent",
 *   "status": "lost",
 *   "charge": "ch_1234567890",
 *   "created": 1635724800,
 *   "is_charge_refundable": false
 * }
 * @return {object} 400 - Bad Request - Invalid account ID
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 403 - Forbidden - Access denied to this dispute
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const closeDispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const disputeId = String(req.params['disputeId']);
  const { accountId } = req.body;
  const userId = user?.id;
  const userRole = user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  if (!accountId) {
    res.status(400).json({ error: 'Account ID is required.' }); return;
  }

  try {
    const stripe = await getOrCreateStripeClient(accountId, userId);
    if (!stripe) {
      res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
    }

    const disputeRecord = await db.select().from(disputeTable).where(eq(disputeTable.stripeDisputeId, disputeId)).limit(1);
    if (disputeRecord.length === 0 || disputeRecord[0]!.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this dispute.' }); return;
    }

    const closedDispute = await stripe.disputes.close(disputeId);

    // Update local database status
    await db.update(disputeTable)
      .set({ status: closedDispute.status, updated_at: new Date() })
      .where(eq(disputeTable.stripeDisputeId, disputeId));

    res.status(200).json(closedDispute);
  } catch (error) {
    next(error);
  }
};
