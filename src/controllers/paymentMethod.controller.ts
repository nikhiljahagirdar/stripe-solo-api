import type { Request, Response, NextFunction } from 'express';
import { findAll, findById } from '../services/paymentMethod.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * POST /api/v1/payment-methods/init
 * @summary Initialize payment method setup
 * @description Creates a setup intent for collecting payment method details
 * @tags Payment Methods
 * @security BearerAuth
 * @param {object} request.body.required - Payment method initialization data
 * @param {integer} request.body.accountId.required - Stripe account ID
 * @param {string} request.body.customerId - Customer ID (optional)
 * @param {string} request.body.usage - Usage type: 'on_session' or 'off_session'
 * @param {array} request.body.paymentMethodTypes - Array of payment method types
 * @return {object} 201 - Setup intent created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const initPaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId, customerId, usage = 'off_session', paymentMethodTypes = ['card'] } = req.body;
    
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    if (!accountId) {res.status(400).json({ error: 'Account ID is required' }); return;}

    const stripe = await getOrCreateStripeClient(accountId, user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage,
      payment_method_types: paymentMethodTypes,
      metadata: { userId: user.id.toString() }
    });

    res.status(201).json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      status: setupIntent.status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stripe payment method object.
 * @typedef {object} StripePaymentMethod
 * @property {string} id - Unique identifier for the payment method
 * @property {string} type - Type of payment method (card, bank_account, etc.)
 * @property {object} card - Card details (if type is card)
 * @property {object} billing_details - Billing information
 * @property {string} customer - ID of the customer this payment method belongs to
 * @property {number} created - Time at which the payment method was created
 */

/**
 * GET /api/v1/payment-methods
 * @summary List all payment methods for the authenticated user
 * @description Retrieves all payment methods associated with the user's customers
 * @tags Payment Methods
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter payment methods.
 * @param {number} [year] year.query - A year to filter payment methods by creation date (e.g., 2024).
 * @param {number} [month] month.query - A month (1-12) to filter payment methods. If omitted, filters entire year.
 * @return {array} 200 - List of payment methods
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const listPaymentMethods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const paymentMethods = await findAll(user.id, accountId, year, month);
    res.json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payment-methods/{paymentMethodId}
 * @summary Retrieve a specific payment method
 * @description Retrieves the details of a payment method
 * @tags Payment Methods
 * @security BearerAuth
 * @param {string} paymentMethodId.path.required - Payment method ID
 * @return {StripePaymentMethod} 200 - Payment method details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Payment method not found
 * @return {object} 500 - Internal Server Error
 */
export const retrievePaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { paymentMethodId } = req.params;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const paymentMethod = await findById(Number(paymentMethodId), user.id);
    if (!paymentMethod) {res.status(404).json({ error: 'Payment method not found' }); return;}

    res.json(paymentMethod);
  } catch (error) {
    next(error);
  }
};
