import type { Request, Response, NextFunction } from 'express';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';
import * as customerService from '../services/customer.service';

/**
 * @typedef {object} LocalCustomer
 * @property {integer} id
 * @property {integer} userId
 * @property {integer} stripeAccountId
 * @property {string} stripeCustomerId
 * @property {string} email
 * @property {string} name
 * @property {string} created_at
 */

/**
 * @typedef {object} StripeCustomer
 * @property {string} id
 * @property {string} object
 * @property {string} email
 * @property {string} name
 * @property {string} description
 * @property {object} metadata
 * @property {integer} created
 * @property {string} currency
 */

export const listCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const page = Math.max(1, Number(req.query['page'] || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(req.query['pageSize'] || '10')));
    const accountId = req.query['accountId'] ? Number(req.query['accountId']) : undefined;
    const query = req.query['query'] as string | undefined;
    const sort = req.query['sort'] as string | undefined;
    const year = req.query['year'] ? Number(req.query['year']) : undefined;
    const month = req.query['month'] ? Number(req.query['month']) : undefined;

    const result = await customerService.findAll({
      page,
      pageSize,
      query,
      sort,
      accountId,
      year,
      month
    });

    res.json({
      data: result.customers,
      total: result.totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(result.totalCount / pageSize)
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

  const { accountId, email, name, description } = req.body;
  if (!accountId) {res.status(400).json({ error: 'Account ID is required' }); return;}

  try {
    const stripe = await getOrCreateStripeClient(accountId, user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    const stripeCustomer = await stripe.customers.create({
      email,
      name,
      description,
      metadata: { userId: user.id.toString() }
    });

    const customer = await customerService.create({
      userId: user.id,
      stripeAccountId: Number(accountId),
      stripeCustomerId: stripeCustomer.id,
      email: stripeCustomer.email ?? undefined,
      name: stripeCustomer.name ?? undefined,
      liveMode: stripeCustomer.livemode,
      created: stripeCustomer.created
    }, user.id);

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const retrieveCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

  const customerId = Number(req.params['customerId']);
  
  if (!customerId) {res.status(400).json({ error: 'Customer ID is required' }); return;}

  try {
    const customer = await customerService.findForUser(customerId, user.id, user.role);
    
    if (!customer) {res.status(404).json({ error: 'Customer not found' }); return;}

    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const getCustomerInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const accountId = String(req.params['accountId']);
  const user = await getUserFromToken(req);
  const userId = user?.id;

  if (!userId) {res.status(401).json({ error: 'Unauthorized' }); return;}
  if (!accountId) {res.status(400).json({ error: 'Account ID is required.' }); return;}

  try {
    const stripe = await getOrCreateStripeClient(accountId, userId);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found.' }); return;}

    // Fetch basic insights - this can be expanded based on needs
    const customers = await stripe.customers.list({ limit: 100 });
    
    res.json({
      totalCustomers: customers.data.length,
      hasMore: customers.has_more,
      // Add more aggregated stats here if needed
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

  const customerId = Number(req.params['customerId']);
  const { email, name } = req.body;

  if (!customerId) {res.status(400).json({ error: 'Customer ID is required' }); return;}

  try {
    const customer = await customerService.update(customerId, { email, name }, user.id, user.role);
    
    if (!customer) {res.status(404).json({ error: 'Customer not found or unauthorized' }); return;}
    
    res.json(customer);
  } catch (error) {
    next(error);
  }
};
