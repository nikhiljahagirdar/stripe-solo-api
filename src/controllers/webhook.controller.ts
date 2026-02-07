import type { Request, Response } from 'express';
import { db } from '../db';
import { customerTable, paymentIntentsTable, stripeAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateStripeClient } from '../services/client.service';
import type Stripe from 'stripe'; // Keep Stripe import for type definitions
import logger from '../utils/logger';

/**
 * Webhook response object.
 * @typedef {object} WebhookResponse
 * @property {boolean} received - Whether the webhook was successfully received and processed
 * @property {string} event_type - Type of the processed event
 * @property {string} event_id - ID of the processed event
 */

/**
 * Webhook request object.
 * @typedef {object} WebhookRequest
 * @property {integer} accountId.required - Stripe account ID to handle webhooks for
 * @property {string} id - Event ID
 * @property {string} type - Event type (e.g., payment_intent.succeeded)
 * @property {object} data - Event data containing the object that triggered the event
 * @property {number} created - Time at which the event was created
 * @property {boolean} livemode - Whether this event was created in live mode
 */

/**
 * POST /api/v1/webhooks
 * @summary Handle Stripe webhook events
 * @description Processes incoming Stripe webhook events for a specific account. Verifies the webhook signature and updates local database records based on the event type.
 * @tags Webhooks
 * @param {string} stripe-signature.header.required - Stripe webhook signature for verification
 * @param {WebhookRequest} request.body.required - Webhook event data from Stripe including account ID
 * @example request - Request body example
 * {
 *   "accountId": 1,
 *   "id": "evt_1234567890",
 *   "type": "payment_intent.succeeded",
 *   "data": {
 *     "object": {
 *       "id": "pi_1234567890",
 *       "amount": 2000,
 *       "currency": "usd",
 *       "status": "succeeded"
 *     }
 *   },
 *   "created": 1635724800,
 *   "livemode": false
 * }
 * @return {WebhookResponse} 200 - Webhook processed successfully
 * @example response - 200 - Success response
 * {
 *   "received": true,
 *   "event_type": "payment_intent.succeeded",
 *   "event_id": "evt_1234567890"
 * }
 * @return {object} 400 - Bad Request - Invalid signature or missing data
 * @example response - 400 - Invalid signature
 * {
 *   "error": "Webhook Error: Invalid signature"
 * }
 * @return {object} 404 - Not Found - Stripe account not found
 * @example response - 404 - Account not found
 * {
 *   "error": "Stripe account with ID 123 not found."
 * }
 * @return {object} 500 - Internal Server Error - Webhook secret decryption failed
 * @example response - 500 - Decryption error
 * {
 *   "error": "Failed to decrypt webhook secret for account ID 123."
 * }
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const accountId = Number(req.body.accountId);
  const sig = req.headers['stripe-signature'];

  if (Number.isNaN(accountId)) {
    res.status(400).json({ error: 'Invalid Account ID provided in params.' }); return;
  }

  if (!sig) {
    res.status(400).json({ error: 'Stripe-Signature header missing.' }); return;
  }

  // Check if Stripe account exists
  const accountExists = await db
    .select({ id: stripeAccounts.id })
    .from(stripeAccounts)
    .where(eq(stripeAccounts.id, accountId))
    .limit(1);

  if (!accountExists || accountExists.length === 0) {
    res.status(404).json({ error: `Stripe account with ID ${accountId} not found.` }); return;
  }

  // Note: Webhook secrets are not currently stored in the database schema.
  // You should configure webhook secrets directly in your Stripe dashboard
  // and provide them via environment variables or configuration.
  const webhookSecret = process.env[`STRIPE_WEBHOOK_SECRET_${accountId}`] ?? process.env['STRIPE_WEBHOOK_SECRET'];

  if (!webhookSecret) {
    res.status(400).json({
      error: `Webhook secret not configured for account ID ${accountId}. Please set STRIPE_WEBHOOK_SECRET_${accountId} or STRIPE_WEBHOOK_SECRET in environment variables.` 
    }); return;
  }

  let event: Stripe.Event;

  try {
    // Get the Stripe client using our service
    const stripe = await getOrCreateStripeClient(accountId.toString(), 1); // TODO: Get actual userId
    if (!stripe) {
      res.status(404).json({ error: 'Stripe client not found for account.' }); return;
    }
    // Use the raw body for verification
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Webhook Error for account ID ${accountId}: ${errorMessage}`);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntentSucceeded = event.data.object;
      logger.info(`PaymentIntent for ${paymentIntentSucceeded.amount} was successful for account ID ${accountId}!`);
      await db.update(paymentIntentsTable)
        .set({ status: paymentIntentSucceeded.status, updatedAt: new Date() })
        .where(eq(paymentIntentsTable.paymentIntentId, paymentIntentSucceeded.id));
      break;
    }
    case 'charge.refunded': {
      const chargeRefunded = event.data.object;
      logger.info(`Charge ${chargeRefunded.id} was refunded for account ID ${accountId}.`);
      if (chargeRefunded.payment_intent) {
        await db.update(paymentIntentsTable)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(paymentIntentsTable.paymentIntentId, chargeRefunded.payment_intent as string));
      }
      break;
    }
    case 'customer.created': {
      const customerCreated = event.data.object;
      logger.info(`Customer ${customerCreated.id} created for account ID ${accountId}.`);
      break;
    }
    case 'customer.updated': {
      const customerUpdated = event.data.object;
      logger.info(`Customer ${customerUpdated.id} updated for account ID ${accountId}.`);
      await db.update(customerTable)
        .set({ email: customerUpdated.email, name: customerUpdated.name })
        .where(eq(customerTable.stripeCustomerId, customerUpdated.id));
      break;
    }
    default:
      logger.info(`Unhandled event type ${event.type} for account ID ${accountId}`);
  }

  res.json({ 
    received: true,
    event_type: event.type,
    event_id: event.id
  });
};
