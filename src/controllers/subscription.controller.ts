import type { Request, Response, NextFunction } from 'express';
import type Stripe from 'stripe';
import { db } from '../db';
import { subscriptionTable, customerTable, priceTable, productTable } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getEffectiveUserId } from '../utils/user.utils';
import { getUserFromToken } from '../utils/auth.utils';
import { getOrCreateStripeClient } from '../services/client.service';
import { 
  findAll, 
  findByStripeId, 
  create as createSubscription, 
  updateStatus, 
  update as updateSubscriptionData 
} from '../services/subscription.service';
import { findByStripeId as findCustomerByStripeId } from '../services/customer.service';
import { findAll as findAllCustomers } from '../services/customer.service';
/**
 * GET /api/v1/subscriptions
 * @summary List all subscriptions for the authenticated user
 * @description Retrieves all subscriptions created by the user with optional date filtering
 * @tags Subscriptions
 * @security BearerAuth
 * @param {string} startDate.query - Start date for filtering (YYYY-MM-DD format)
 * @param {string} endDate.query - End date for filtering (YYYY-MM-DD format)
 * @param {string} period.query - Predefined period (7d, 30d, 90d, 1y)
 * @param {string} status.query - Subscription status filter (active, canceled, past_due)
 * @return {array<object>} 200 - List of subscriptions
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
/**
 * GET /api/v1/subscriptions/all
 * @summary List all subscriptions with concatenated price ID and product name
 * @description Retrieves all subscriptions with price ID concatenated with product name, no pagination
 * @tags Subscriptions
 * @security BearerAuth
 * @return {array<object>} 200 - List of all subscriptions
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const listAllSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = await getEffectiveUserId(req);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const subscriptions = await db
      .select({
        id: subscriptionTable.id,
        stripeSubscriptionId: subscriptionTable.stripeSubscriptionId,
        status: subscriptionTable.status,
        quantity: subscriptionTable.quantity,
        priceIdWithProduct: sql`CONCAT(${priceTable.stripePriceId}, ' - ', ${productTable.name})`.as('priceIdWithProduct'),
        stripePriceId: subscriptionTable.stripePriceId,
        customerName: customerTable.name,
        customerEmail: customerTable.email,
        unitAmount: priceTable.unitAmount,
        currency: priceTable.currency,
        recurringInterval: priceTable.recurringInterval,
        currentPeriodStart: subscriptionTable.currentPeriodStart,
        currentPeriodEnd: subscriptionTable.currentPeriodEnd,
        createdAt: subscriptionTable.createdAt
      })
      .from(subscriptionTable)
      .leftJoin(customerTable, eq(subscriptionTable.stripeCustomerId, customerTable.stripeCustomerId))
      .leftJoin(priceTable, eq(subscriptionTable.stripePriceId, priceTable.stripePriceId))
      .leftJoin(productTable, eq(priceTable.stripeProductId, productTable.stripeProductId))
      .where(eq(subscriptionTable.userId, userId))
      .orderBy(desc(subscriptionTable.createdAt));

    res.status(200).json(subscriptions);
  } catch (error) {
    next(error);
  }
};

export const listSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = await getEffectiveUserId(req);
  const { page, pageSize, query, sort, filter, startDate, endDate, period, status, customerName, priceId, interval, quantity, currentPeriodStart, currentPeriodEnd, accountId, year } = req.query;

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

    const { subscriptions, totalCount } = await findAll({
      page: pageNum,
      pageSize: pageSizeNum,
      query: query as string | undefined,
      sort: sort as string | undefined,
      filter: filter as Record<string, string> | undefined,
      userId: userId,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      status: status as string | undefined,
      customerName: customerName as string | undefined,
      priceId: priceId as string | undefined,
      interval: interval as string | undefined,
      quantity: quantity ? +(quantity as string) : undefined,
      currentPeriodStart: currentPeriodStart as string | undefined,
      currentPeriodEnd: currentPeriodEnd as string | undefined,
      accountId: accountId ? Number(accountId as string) : undefined,
      year: year ? Number(year as string) : undefined,
    });

    const totalPages = Math.ceil(totalCount / pageSizeNum);
    res.status(200).json({ 
      data: subscriptions, 
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
 * GET /api/v1/subscriptions/{subscriptionId}
 * @summary Retrieve a specific subscription
 * @description Retrieves the details of a subscription
 * @tags Subscriptions
 * @security BearerAuth
 * @param {string} subscriptionId.path.required - Subscription ID
 * @return {object} 200 - Subscription details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Subscription not found
 * @return {object} 500 - Internal Server Error
 */
export const retrieveSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const subscriptionId = String(req.params['subscriptionId']);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const subscription = await findByStripeId(subscriptionId, user.id);
    
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' }); return;
    }

    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/subscriptions/{subscriptionId}
 * @summary Update a subscription
 * @description Updates an existing subscription
 * @tags Subscriptions
 * @security BearerAuth
 * @param {string} subscriptionId.path.required - Subscription ID
 * @param {object} request.body.required - Update data
 * @return {object} 200 - Subscription updated successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Subscription not found
 * @return {object} 500 - Internal Server Error
 */
export const updateSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const subscriptionId = String(req.params['subscriptionId']);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const result = await updateSubscriptionData(subscriptionId, req.body, user.id);

    if (!result) {res.status(404).json({ error: 'Subscription not found' }); return;}
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/subscriptions
 * @summary Create a new subscription
 * @description Creates a subscription for a customer
 * @tags Subscriptions
 * @security BearerAuth
 * @param {object} request.body.required - Subscription creation data
 * @param {integer} request.body.accountId.required - Stripe account ID
 * @param {string} request.body.customerId.required - Customer ID
 * @param {string} request.body.priceId.required - Price ID
 * @param {integer} request.body.quantity - Quantity (default: 1)
 * @return {object} 201 - Subscription created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden
 * @return {object} 404 - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const createNewSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const { accountId, customerId, priceId, quantity = 1, trialPeriodDays, coupon, metadata } = req.body;
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

    // Verify customer belongs to user
    const customerRecord = await findCustomerByStripeId(customerId, userId);
    if (!customerRecord) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this customer.' }); return;
    }

    const subscription: Stripe.Subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId, quantity }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      payment_settings: { save_default_payment_method: 'on_subscription' },
      trial_period_days: trialPeriodDays,
      discounts: coupon ? [{ coupon }] : undefined,
      metadata: { ...metadata, userId },
    });

    // Store a reference in your database
    await createSubscription({
      userId: userId,
      stripeAccountId: accountId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      quantity: quantity,
    });

    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
};


/**
 * DELETE /api/v1/subscriptions/{subscriptionId}
 * @summary Cancel a subscription
 * @description Cancels an active subscription
 * @tags Subscriptions
 * @security BearerAuth
 * @param {string} subscriptionId.path.required - Subscription ID
 * @param {object} request.body.required - Cancel data
 * @param {integer} request.body.accountId.required - Stripe account ID
 * @return {object} 200 - Subscription canceled successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 403 - Forbidden
 * @return {object} 404 - Subscription not found
 * @return {object} 500 - Internal Server Error
 */
export const cancelSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const subscriptionId = String(req.params['subscriptionId']);
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

    // Verify subscription belongs to user
    const subscriptionRecord = await findByStripeId(subscriptionId, userId);
    if (!subscriptionRecord) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this subscription.' }); return;
    }

    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    await updateStatus(subscriptionId, canceledSubscription.status, userId);

    res.status(200).json(canceledSubscription);
  } catch (error) {
    next(error);
  }
};


/**
 * @function updateSubscriptionPlan
 * @async
 * @description updates a subscription plan
 * @param req
 * @param res
 * @returns
 */
export const updateSubscriptionPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const subscriptionId = String(req.params['subscriptionId']);
  const { accountId, newPriceId, prorate = true } = req.body;
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

    // Verify subscription belongs to user
    const subscriptionRecord = await findByStripeId(subscriptionId, userId);
    if (!subscriptionRecord) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this subscription.' }); return;
    }

    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!currentSubscription) {
      res.status(404).json({ error: 'Subscription not found.' }); return;
    }

    // Get the current subscription item
    const subscriptionItemId = currentSubscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      res.status(400).json({ error: 'No subscription items found.' });
      return;
    }

    const updatedSubscription: Stripe.Subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: prorate ? 'always_invoice' : 'create_prorations',
    });

    await updateSubscriptionData(subscriptionId, {
      stripePriceId: newPriceId,
      status: updatedSubscription.status,
      currentPeriodStart: new Date((updatedSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
    }, userId);

    res.status(200).json(updatedSubscription);
  } catch (error) {
    next(error);
  }
};


/**
 * @function updateSubscriptionQuantity
 * @async
 * @description updates a subscription quantity
 * @param req
 * @param res
 * @returns
 */
export const updateSubscriptionQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const subscriptionId = String(req.params['subscriptionId']);
  const { accountId, quantity } = req.body;
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

    // Verify subscription belongs to user
    const subscriptionRecord = await findByStripeId(subscriptionId, userId);
    if (!subscriptionRecord) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this subscription.' }); return;
    }

    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!currentSubscription) {
      res.status(404).json({ error: 'Subscription not found.' }); return;
    }

    // Get the current subscription item
    if (!currentSubscription.items.data[0]) {
      res.status(400).json({ error: 'Subscription has no items.' }); return;
    }
    const subscriptionItemId = currentSubscription.items.data[0].id;

    const updatedSubscription: Stripe.Subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          quantity: quantity,
        },
      ],
    });

    await updateSubscriptionData(subscriptionId, {
      quantity: quantity,
      status: updatedSubscription.status,
      currentPeriodStart: new Date((updatedSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
    }, userId);

    res.status(200).json(updatedSubscription);
  } catch (error) {
    next(error);
  }
};


/**
 * @function getSubscriptionInsights
 * @async
 * @description gets subscription insights
 * @param req
 * @param res
 * @returns
 */
export const getSubscriptionInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Fetch all subscriptions for customers associated with the user
    const { customers: userCustomers } = await findAllCustomers({ accountId: Number(accountId) });
    const customerStripeIds = userCustomers.map(c => c.stripeCustomerId).filter((id): id is string => id !== null);

    if (customerStripeIds.length === 0) {
      res.status(200).json({ message: 'No subscriptions found for this user.', subscriptions: [] }); return;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerStripeIds.length > 1 ? undefined : customerStripeIds[0], // Stripe list API only takes one customer ID
      limit: 100, // Fetch up to 100 subscriptions
      status: 'all', // Get all statuses for insights
    });

    // Here you would process `subscriptions.data` to calculate MRR, churn, etc.
    // For now, returning the raw list.
    res.status(200).json(subscriptions.data);
  } catch (error) {
    next(error);
  }
};
