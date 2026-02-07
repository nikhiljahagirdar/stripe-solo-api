import type { Request, Response, NextFunction } from 'express';
import type Stripe from 'stripe';
import { db } from '../db';
import {
  paymentIntentsTable,
  customerTable,
  taxSettingsTable,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getEffectiveUserId } from '../utils/user.utils';
import { getUserFromToken } from '../utils/auth.utils';
import { getOrCreateStripeClient } from '../services/client.service';
import { findAll as findAllPayments } from '../services/payment.service';

type TaxMode = 'automatic' | 'manual' | 'disabled';

interface AccountTaxSettings {
  accountId: number;
  taxMode: TaxMode;
  defaultTaxCode?: string | null;
  manualTaxPercent?: number | null; // 18 => 18%
  requireAddress?: boolean | null;
}

type CreatePaymentIntentBody = {
  accountId: number;
  amount: number; // base amount in minor units (e.g. 1000 = 10.00)
  currency: string;
  customerId?: string;
  paymentMethodType?: Stripe.PaymentMethodCreateParams.Type; // "card", etc.
  metadata?: Record<string, string>;
  description?: string;
  // optionally override settings per-call (e.g. address)
  taxConfig?: {
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country: string;
    };
    /**
     * Optional override of tax mode for this single call
     * (if you want per-PI override – otherwise ignore this).
     */
    modeOverride?: TaxMode;
    taxCodeOverride?: string;
  };
};

/* --------------------------------- Helpers -------------------------------- */

const loadAccountTaxSettings = async (
  accountId: number
): Promise<AccountTaxSettings | null> => {
  const rows = await db
    .select()
    .from(taxSettingsTable)
    .where(eq(taxSettingsTable.accountId, accountId))
    .limit(1);

  if (rows.length === 0) {return null;}

  const row = rows[0]!;
  return {
    accountId: row.accountId,
    taxMode: row.taxMode as TaxMode,
    defaultTaxCode: row.defaultTaxCode,
    manualTaxPercent: row.manualTaxPercent
      ? parseFloat(row.manualTaxPercent)
      : null,
    requireAddress: row.requireAddress ?? true,
  };
};

const upsertAccountTaxSettings = async (
  accountId: number,
  payload: Partial<AccountTaxSettings>
) => {
  const existing = await loadAccountTaxSettings(accountId);

  const dataToUpsert = {
    accountId,
    taxMode: payload.taxMode ?? (existing?.taxMode || 'disabled'),
    defaultTaxCode: payload.defaultTaxCode ?? existing?.defaultTaxCode,
    manualTaxPercent: payload.manualTaxPercent !== undefined ? (payload.manualTaxPercent !== null ? payload.manualTaxPercent.toString() : null) : (existing?.manualTaxPercent ? existing.manualTaxPercent.toString() : null),
    requireAddress: payload.requireAddress ?? existing?.requireAddress ?? true,
  };

  if (!existing) {
    await db.insert(taxSettingsTable).values(dataToUpsert);
  } else {
    await db
      .update(taxSettingsTable)
      .set(dataToUpsert)
      .where(eq(taxSettingsTable.accountId, accountId));
  }
};


const calculateManualTaxAmount = (
  baseAmount: number,
  manualTaxPercent?: number | null
): { taxAmount: number; totalAmount: number } => {
  if (!manualTaxPercent || manualTaxPercent <= 0) {
    return { taxAmount: 0, totalAmount: baseAmount };
  }
  const taxAmount = Math.round((baseAmount * manualTaxPercent) / 100);
  return { taxAmount, totalAmount: baseAmount + taxAmount };
};

/**
 * For automatic mode, use Stripe Tax calculation + new hooks.
 */
const createStripeTaxCalculation = async (params: {
  stripe: Stripe;
  baseAmount: number;
  currency: string;
  address: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country: string;
  };
  taxCode?: string;
}) => {
  const calculation = await params.stripe.tax.calculations.create({
    currency: params.currency,
    line_items: [
      {
        amount: params.baseAmount,
        reference: 'line_item_1',
        tax_code: params.taxCode,
      },
    ],
    customer_details: {
      address: params.address,
      address_source: 'shipping', // or "billing"
    },
  });

  return calculation;
};

/* ------------------------------ Tax Settings API ------------------------------ */

export const getTaxSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await getUserFromToken(req);
    const accountId = String(req.params['accountId']);
    const userId = user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }

    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required.' }); return;
    }
    
    const settings = await loadAccountTaxSettings(Number(accountId));

    if (!settings) {
        res.status(404).json({ error: 'Tax settings not found for this account.' }); return;
    }

    res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
};

export const updateTaxSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await getUserFromToken(req);
    const accountId = String(req.params['accountId']);
    const userId = user?.id;
    const { taxMode, defaultTaxCode, manualTaxPercent, requireAddress } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }

    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required.' }); return;
    }
    
    if (taxMode && !['automatic', 'manual', 'disabled'].includes(taxMode)) {
      res.status(400).json({ error: 'Invalid taxMode.' }); return;
    }

    await upsertAccountTaxSettings(Number(accountId), {
      taxMode,
      defaultTaxCode,
      manualTaxPercent,
      requireAddress,
    });

    const updated = await loadAccountTaxSettings(Number(accountId));

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

/* -------------------------- Payment Intent + Tax -------------------------- */

export const listPaymentIntents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = await getEffectiveUserId(req);
  const { page, pageSize, query, sort, filter, startDate, endDate, period, status, currency, customerName, accountId, year } = req.query;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const pageNum = page ? Number(page as string) : 1;
    const pageSizeNum = pageSize ? Number(pageSize as string) : 10;

    // Handle period vs custom date range filtering
    let effectiveStartDate: string | undefined = (startDate as string) || '';
    let effectiveEndDate: string | undefined = (endDate as string) || '';
    
    if (period === 'custom') {
      // Use custom date range - startDate and endDate should be provided
      effectiveStartDate = startDate as string;
      effectiveEndDate = endDate as string;
    } else if (period && period !== 'custom') {
      // Use predefined period shortcuts
      const now = new Date();
      const periodMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };
      
      if (periodMap[period as string]!) {
        const daysAgo = new Date(now.getTime() - (periodMap[period as string]! * 24 * 60 * 60 * 1000));
        effectiveStartDate = daysAgo.toISOString().split('T')[0];
        effectiveEndDate = now.toISOString().split('T')[0];
      }
    }
    // If no period is specified, effectiveStartDate and effectiveEndDate remain as provided

    const { paymentIntents, totalCount } = await findAllPayments({
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
      data: paymentIntents, 
      totalCount, 
      totalRecords: totalCount,
      totalPages 
    });
  } catch (error) {
    next(error);
  }
};

export const createPaymentIntent = async (
  req: Request<Record<string, never>, Record<string, never>, CreatePaymentIntentBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await getUserFromToken(req);
  const {
    accountId,
    amount,
    currency,
    customerId,
    paymentMethodType,
    metadata,
    description,
    taxConfig,
  } = req.body;
  const userId = user?.id;
  const userRole = user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized: User ID or Role not found.' }); return;
  }

  if (!accountId) {
    res.status(400).json({ error: 'Account ID is required.' }); return;
  }

  try {
    const stripe = await getOrCreateStripeClient(accountId.toString(), userId);
    if (!stripe) {
      res
        .status(404)
        .json({ error: 'Stripe account not found or unauthorized.' });
      return;
    }

    const accountTaxSettings =
      (await loadAccountTaxSettings(accountId)) ?? ({
        accountId,
        taxMode: 'disabled',
        defaultTaxCode: undefined,
        manualTaxPercent: undefined,
        requireAddress: true,
      } as AccountTaxSettings);

    const effectiveTaxMode =
      taxConfig?.modeOverride ?? accountTaxSettings.taxMode;

    let stripeCustomerId = customerId;

    if (!stripeCustomerId) {
      const existingCustomer = await db
        .select()
        .from(customerTable)
        .where(eq(customerTable.userId, userId))
        .limit(1);

      if (existingCustomer.length > 0 && existingCustomer[0]?.stripeCustomerId) {
        stripeCustomerId = existingCustomer[0].stripeCustomerId;
      } else if (user.email) {
        const customer = await stripe.customers.create({
          email: user.email,
          description: `Customer for user ${userId}`,
          metadata: { userId: String(userId) },
        });

        stripeCustomerId = customer.id;

        await db.insert(customerTable).values({
          userId,
          stripeAccountId: accountId,
          stripeCustomerId: customer.id,
          email: customer.email,
          name: customer.name,
        });
      }
    }

    let finalAmount = amount;
    let taxAmount = 0;
    let taxCalculationId: string | undefined;

    const address = taxConfig?.address;

    if (
      effectiveTaxMode === 'automatic' &&
      accountTaxSettings.taxMode === 'automatic'
    ) {
      if (!address?.country) {
        if (accountTaxSettings.requireAddress) {
          res.status(400).json({
            error:
              'Automatic tax enabled but no customer address with country. Provide taxConfig.address or store user address.',
          }); return;
        }
      } else {
        const taxCode =
          taxConfig?.taxCodeOverride ?? accountTaxSettings.defaultTaxCode ?? undefined;

        const calculation = await createStripeTaxCalculation({
          stripe,
          baseAmount: amount,
          currency,
          address,
          taxCode,
        });

        taxCalculationId = calculation.id ?? undefined;
        finalAmount = calculation.amount_total;
        taxAmount = calculation.tax_amount_exclusive ?? 0;
      }
    } else if (effectiveTaxMode === 'manual') {
      const { taxAmount: taxAmt, totalAmount } = calculateManualTaxAmount(
        amount,
        accountTaxSettings.manualTaxPercent
      );
      taxAmount = taxAmt;
      finalAmount = totalAmount;
    } else {
      finalAmount = amount;
      taxAmount = 0;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency,
      customer: stripeCustomerId,
      payment_method_types: paymentMethodType ? [paymentMethodType] : ['card'],
      metadata: {
        ...metadata,
        userId: String(userId),
        taxMode: effectiveTaxMode,
        manualTaxAmount: String(taxAmount) || '0',
        manualTaxPercent: accountTaxSettings.manualTaxPercent ? String(accountTaxSettings.manualTaxPercent) : '0',
        taxCalculationId: taxCalculationId ?? '',
      },
      description
    });

    await db.insert(paymentIntentsTable).values({
      userId,
      stripeAccountId: accountId,
      stripeCustomerId,
      paymentIntentId: paymentIntent.id,
      amount: (paymentIntent.amount / 100).toString(),
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      tax: {
        mode: effectiveTaxMode,
        taxAmount,
        taxCalculationId: taxCalculationId ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const retrievePaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await getUserFromToken(req);
  const paymentIntentId = String(req.params['paymentIntentId']);
  const accountId = req.query['accountId'] ? String(req.query['accountId']) : undefined;
  const userId = user?.id;
  const userRole = user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized: User ID or Role not found.' }); return;
  }

  if (!accountId) {
    res.status(400).json({ error: 'Account ID is required.' }); return;
  }

  try {
    const stripe = await getOrCreateStripeClient(accountId, userId);
    if (!stripe) {
      res
        .status(404)
        .json({ error: 'Stripe account not found or unauthorized.' });
      return;
    }

    const paymentIntentRecord = await db.query.paymentIntentsTable.findFirst({
        where: and(
            eq(paymentIntentsTable.paymentIntentId, paymentIntentId),
            eq(paymentIntentsTable.userId, userId)
        )
    });

    if (!paymentIntentRecord) {
      res.status(403).json({
        error: 'Forbidden: You do not have access to this payment intent.',
      }); return;
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );

    res.status(200).json(paymentIntent);
  } catch (error) {
    next(error);
  }
};

export const createRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await getUserFromToken(req);
  const { accountId, paymentIntentId, amount, reason, metadata } = req.body;
  const userId = user?.id;
  const userRole = user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized: User ID or Role not found.' }); return;
  }

  if (!accountId) {
    res.status(400).json({ error: 'Account ID is required.' }); return;
  }

  try {
    const stripe = await getOrCreateStripeClient(accountId as string, userId);
    if (!stripe) {
      res
        .status(404)
        .json({ error: 'Stripe account not found or unauthorized.' });
      return;
    }

    const paymentIntentRecord = await db.query.paymentIntentsTable.findFirst({
        where: and(
            eq(paymentIntentsTable.paymentIntentId, paymentIntentId),
            eq(paymentIntentsTable.userId, userId)
        )
    });

    if (!paymentIntentRecord) {
      res.status(403).json({
        error: 'Forbidden: You do not have access to refund this payment intent.',
      }); return;
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
      metadata: { ...metadata, userId: String(userId) },
    });

    // e.g. mark as refunded in DB if you want

    res.status(201).json(refund);
  } catch (error) {
    next(error);
  }
};
