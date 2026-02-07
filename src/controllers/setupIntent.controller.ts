import type { Request, Response } from 'express';
import { SetupIntentService } from '../services/setupIntent.service';
import type Stripe from 'stripe';

/**
 * @swagger
 * components:
 *   schemas:
 *     SetupIntent:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 101
 *         stripeAccountId:
 *           type: integer
 *           example: 2
 *         stripeSetupIntentId:
 *           type: string
 *           example: "seti_123"
 *         stripeCustomerId:
 *           type: string
 *           nullable: true
 *           example: "cus_123"
 *         status:
 *           type: string
 *           example: "requires_payment_method"
 *         usage:
 *           type: string
 *           example: "off_session"
 *         created:
 *           type: integer
 *           example: 1678043844
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */

const setupIntentService = new SetupIntentService();

/**
 * @swagger
 * /setup-intents:
 *   post:
 *     summary: Create a new SetupIntent
 *     tags: [SetupIntents]
 *     description: Creates a SetupIntent to set up a customer's payment method for future payments.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeAccountId]
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *                 description: The database ID of the Stripe account to use.
 *                 example: 2
 *               customer:
 *                 type: string
 *                 description: The ID of the Customer to set up this payment method for.
 *                 example: "cus_NqgYp2s5Y6a7Z8"
 *               usage:
 *                 type: string
 *                 description: Indicates how the payment method is intended to be used in the future.
 *                 example: "off_session"
 *     responses:
 *       '201':
 *         description: SetupIntent created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SetupIntent'
 *       '400':
 *         description: Bad request.
 *       '500':
 *         description: Internal server error.
 */
export const createSetupIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { stripeAccountId, ...setupData }: { stripeAccountId: number } & Stripe.SetupIntentCreateParams = req.body;

    if (!stripeAccountId) {
      res.status(400).json({ message: 'stripeAccountId is required.' }); return;
    }

    const setupIntent = await setupIntentService.create(userId, stripeAccountId, setupData);
    res.status(201).json(setupIntent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /setup-intents:
 *   get:
 *     summary: Get all SetupIntents for a user
 *     tags: [SetupIntents]
 *     description: Retrieves a list of all SetupIntents associated with the authenticated user.
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: The database ID of the Stripe account to filter by.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: The year to filter by.
 *     responses:
 *       '200':
 *         description: A list of SetupIntents.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SetupIntent'
 *       '500':
 *         description: Internal server error.
 */
export const getAllSetupIntents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const setupIntents = await setupIntentService.findByUser(userId, accountId, year);
    res.status(200).json(setupIntents);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /setup-intents/{id}:
 *   get:
 *     summary: Get a single SetupIntent by ID
 *     tags: [SetupIntents]
 *     description: Retrieves a specific SetupIntent by its database ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the SetupIntent to retrieve.
 *     responses:
 *       '200':
 *         description: The requested SetupIntent.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SetupIntent'
 *       '404':
 *         description: SetupIntent not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
export const getSetupIntentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'ID is required.' });
      return;
    }

    const setupIntent = await setupIntentService.findById(userId, +id);

    if (!setupIntent) {
      res.status(404).json({ message: 'SetupIntent not found.' }); return;
    }

    res.status(200).json(setupIntent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /setup-intents/{id}/confirm:
 *   post:
 *     summary: Confirm a SetupIntent
 *     tags: [SetupIntents]
 *     description: Confirms a SetupIntent using a payment method.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the SetupIntent to confirm.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeAccountId, payment_method]
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *                 description: The database ID of the Stripe account to use.
 *                 example: 2
 *               payment_method:
 *                 type: string
 *                 description: ID of the payment method to attach to this SetupIntent.
 *                 example: "pm_card_visa"
 *     responses:
 *       '200':
 *         description: SetupIntent confirmed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SetupIntent'
 *       '404':
 *         description: SetupIntent not found.
 *       '500':
 *         description: Internal server error.
 */
export const confirmSetupIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { id } = req.params;
    const { stripeAccountId, ...confirmData }: { stripeAccountId: number } & Stripe.SetupIntentConfirmParams = req.body;

    if (!id) {
      res.status(400).json({ message: 'ID is required.' });
      return;
    }

    if (!stripeAccountId || !confirmData.payment_method) {
      res.status(400).json({ message: 'stripeAccountId and payment_method are required.' }); return;
    }

    const setupIntent = await setupIntentService.confirm(userId, stripeAccountId, +id, confirmData);
    if (!setupIntent) {
      res.status(404).json({ message: 'SetupIntent not found.' }); return;
    }
    res.status(200).json(setupIntent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /setup-intents/{id}/cancel:
 *   post:
 *     summary: Cancel a SetupIntent
 *     tags: [SetupIntents]
 *     description: Cancels a SetupIntent.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the SetupIntent to cancel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeAccountId]
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *                 description: The database ID of the Stripe account to use.
 *                 example: 2
 *     responses:
 *       '200':
 *         description: SetupIntent canceled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SetupIntent'
 *       '404':
 *         description: SetupIntent not found.
 *       '500':
 *         description: Internal server error.
 */
export const cancelSetupIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { id } = req.params;
    const { stripeAccountId } = req.body;

    if (!id) {
      res.status(400).json({ message: 'ID is required.' });
      return;
    }

    if (!stripeAccountId) {
      res.status(400).json({ message: 'stripeAccountId is required.' }); return;
    }

    const setupIntent = await setupIntentService.cancel(userId, stripeAccountId, +id);
    if (!setupIntent) {
      res.status(404).json({ message: 'SetupIntent not found.' }); return;
    }
    res.status(200).json(setupIntent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};
