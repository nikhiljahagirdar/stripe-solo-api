import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { invoiceTable, customerTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '../utils/auth.utils';
import { getOrCreateStripeClient } from '../services/client.service';
import { findAll } from '../services/invoice.service';

/**
 * @function finalizeAndPayInvoice
 * @async
 * @description finalizes and pays an invoice
 * @param req
 * @param res
 * @returns
 */
export const finalizeAndPayInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const invoiceId = String(req.params['invoiceId']);
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

    const invoiceRecord = await db.select().from(invoiceTable).where(eq(invoiceTable.stripeInvoiceId, invoiceId)).limit(1);
    if (invoiceRecord.length === 0 || invoiceRecord[0]!.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this invoice.' }); return;
    }

    await stripe.invoices.finalizeInvoice(invoiceId);

    // Pay the invoice
    const paidInvoice = await stripe.invoices.pay(invoiceId);

    await db.update(invoiceTable)
      .set({ status: paidInvoice.status || 'paid', updatedAt: new Date() })
      .where(eq(invoiceTable.stripeInvoiceId, invoiceId));

    res.status(200).json(paidInvoice);
  } catch (error) {
    next(error);
  }
};


/**
 * @function voidInvoice
 * @async
 * @description voids an invoice
 * @param req
 * @param res
 * @returns
 */
export const voidInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const invoiceId = String(req.params['invoiceId']);
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

    const invoiceRecord = await db.select().from(invoiceTable).where(eq(invoiceTable.stripeInvoiceId, invoiceId)).limit(1);
    if (invoiceRecord.length === 0 || invoiceRecord[0]!.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this invoice.' }); return;
    }

    const voidedInvoice = await stripe.invoices.voidInvoice(invoiceId);

    await db.update(invoiceTable)
      .set({ status: voidedInvoice.status || 'void', updatedAt: new Date() })
      .where(eq(invoiceTable.stripeInvoiceId, invoiceId));

    res.status(200).json(voidedInvoice);
  } catch (error) {
    next(error);
  }
};


/**
 * @function getInvoiceInsights
 * @async
 * @description gets invoice insights
 * @param req
 * @param res
 * @returns
 */
/**
 * GET /api/v1/invoices
 * @summary List all invoices for the authenticated user
 * @description Retrieves all invoices created by the user with optional filtering
 * @tags Invoices
 * @security BearerAuth
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} status.query - Invoice status filter (draft, open, paid, void, uncollectible)
 * @param {string} customerId.query - Filter by customer ID
 * @param {number} [year] year.query - A year to filter invoices by creation date (e.g., 2024).
 * @param {number} [month] month.query - A month (1-12) to filter invoices. If omitted, filters entire year.
 * @return {array<object>} 200 - List of invoices
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const { page, pageSize, query, sort, filter, startDate, endDate, period, status, currency, customerName, accountId, year } = req.query;
  const userId = user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const pageNum = page ? Number(page as string) : 1;
    const pageSizeNum = pageSize ? Number(pageSize as string) : 10;

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

    const { invoices, totalCount } = await findAll({
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
      customerName: customerName as string | undefined,
      accountId: accountId ? Number(accountId as string) : undefined,
      year: year ? Number(year as string) : undefined,
    });

    const totalPages = Math.ceil(totalCount / pageSizeNum);
    res.status(200).json({ 
      data: invoices, 
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

export const retrieveInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const invoiceId = String(req.params['invoiceId']);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const invoice = await db.select().from(invoiceTable)
      .where(eq(invoiceTable.stripeInvoiceId, invoiceId))
      .limit(1);
    
    if (invoice[0]?.userId !== user.id) {
      res.status(404).json({ error: 'Invoice not found' }); return;
    }

    res.json(invoice[0]);
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const invoiceId = String(req.params['invoiceId']);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const result = await db.update(invoiceTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(invoiceTable.stripeInvoiceId, invoiceId))
      .returning();

    if (!result[0]) {res.status(404).json({ error: 'Invoice not found' }); return;}
    res.json(result[0]);
  } catch (error) {
    next(error);
  }
};

export const getInvoiceInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const accountId = String(req.params['accountId']);
  const userId = user?.id;
  const userRole = user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  if (Number.isNaN(Number(accountId))) {
    res.status(400).json({ error: 'Invalid account ID provided.' }); return;
  }

  if (!accountId) {
    res.status(400).json({ error: 'Account ID is required.' }); return;
  }

  try {
    const stripe = await getOrCreateStripeClient(accountId, userId);
    if (!stripe) {
      res.status(404).json({ error: 'Stripe account not found or unauthorized.' }); return;
    }

    const userCustomers = await db.select().from(customerTable).where(eq(customerTable.userId, userId));
    const customerStripeIds = userCustomers.map(c => c.stripeCustomerId);

    if (customerStripeIds.length === 0) {
      res.status(200).json({ message: 'No invoices found for this user.', invoices: [] }); return;
    }

    const invoices = await stripe.invoices.list({
      customer: customerStripeIds.length > 1 ? undefined : customerStripeIds[0], // Stripe list API only takes one customer ID
      collection_method: 'charge_automatically', // Filter for auto-collected invoices
      limit: 100, // Fetch up to 100 invoices
    });

    // You would then process these invoices to derive insights (paid/unpaid stats, aging report)
    // For now, returning the raw list.
    res.status(200).json(invoices.data);
  } catch (error) {
    next(error);
  }
};
