import type { Request, Response } from 'express';
import { TransferService } from '../services/transfer.service';
import type Stripe from 'stripe';

/**
 * @swagger
 * components:
 *   schemas:
 *     Transfer:
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
 *         stripeTransferId:
 *           type: string
 *           example: "tr_123"
 *         amount:
 *           type: number
 *           example: 400
 *         currency:
 *           type: string
 *           example: "usd"
 *         destination:
 *           type: string
 *           example: "acct_123"
 *         status:
 *           type: string
 *           example: "succeeded"
 *         metadata:
 *           type: string
 *           nullable: true
 *           example: '{"order_id":"6735"}'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */

const transferService = new TransferService();

/**
 * @swagger
 * /transfers:
 *   post:
 *     summary: Create a new Stripe transfer
 *     tags: [Transfers]
 *     description: Creates a transfer from your Stripe account to a connected account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeAccountId, amount, currency, destination]
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *                 description: The database ID of the Stripe account to use.
 *                 example: 2
 *               amount:
 *                 type: integer
 *                 description: A positive integer in cents representing how much to transfer.
 *                 example: 1000
 *               currency:
 *                 type: string
 *                 description: 3-letter ISO currency code.
 *                 example: "usd"
 *               destination:
 *                 type: string
 *                 description: The ID of a connected Stripe account.
 *                 example: "acct_1MTfjCQ9PRzxEwkZ"
 *     responses:
 *       '201':
 *         description: Transfer created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transfer'
 *       '400':
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
export const createTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { stripeAccountId, ...transferData }: { stripeAccountId: number } & Stripe.TransferCreateParams = req.body;

    if (!stripeAccountId || !transferData.amount || !transferData.currency || !transferData.destination) {
      res.status(400).json({ message: 'Missing required fields: stripeAccountId, amount, currency, destination.' }); return;
    }

    const transfer = await transferService.create(userId, stripeAccountId, transferData);
    res.status(201).json(transfer);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /transfers/{id}/reverse:
 *   post:
 *     summary: Reverse a transfer
 *     tags: [Transfers]
 *     description: Reverses a transfer that has not yet been paid out.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the transfer to reverse.
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
 *               amount:
 *                 type: integer
 *                 description: A positive integer in cents representing how much of this transfer to reverse. Can be left blank to reverse the full amount.
 *                 example: 500
 *     responses:
 *       '200':
 *         description: Transfer reversed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transfer'
 *       '404':
 *         description: Transfer not found.
 *       '500':
 *         description: Internal server error.
 */
export const reverseTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const id = String(req.params['id']);
    const { stripeAccountId, ...reverseData } = req.body;

    if (!stripeAccountId) {
      res.status(400).json({ message: 'stripeAccountId is required.' }); return;
    }

    const transfer = await transferService.reverse(userId, stripeAccountId, +id, reverseData);
    if (!transfer) {
      res.status(404).json({ message: 'Transfer not found.' }); return;
    }
    res.status(200).json(transfer);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /transfers:
 *   get:
 *     summary: Get all transfers for a user
 *     tags: [Transfers]
 *     description: Retrieves a list of all transfers associated with the authenticated user.
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
 *         description: A list of transfers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transfer'
 *       '500':
 *         description: Internal server error.
 */
export const getAllTransfers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const transfers = await transferService.findByUser(userId, accountId, year);
    res.status(200).json(transfers);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /transfers/{id}:
 *   get:
 *     summary: Get a single transfer by ID
 *     tags: [Transfers]
 *     description: Retrieves a specific transfer by its database ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the transfer to retrieve.
 *     responses:
 *       '200':
 *         description: The requested transfer.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transfer'
 *       '404':
 *         description: Transfer not found.
 *       '500':
 *         description: Internal server error.
 */
export const getTransferById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'ID is required.' });
      return;
    }

    const transfer = await transferService.findById(userId, +id);

    if (!transfer) {
      res.status(404).json({ message: 'Transfer not found.' }); return;
    }

    res.status(200).json(transfer);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /transfers/sync:
 *   post:
 *     summary: Sync a transfer from Stripe
 *     tags: [Transfers]
 *     description: Retrieves a transfer from Stripe using its ID and creates or updates it in the local database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeAccountId, stripeTransferId]
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *                 description: The database ID of the Stripe account to use.
 *                 example: 2
 *               stripeTransferId:
 *                 type: string
 *                 description: The ID of the Stripe Transfer to sync (e.g., "tr_...").
 *                 example: "tr_1MiN3gLkdIwHu7ixNCZvFdgA"
 *     responses:
 *       '200':
 *         description: Transfer synced successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transfer'
 *       '400':
 *         description: Bad request.
 *       '500':
 *         description: Internal server error.
 */
export const syncTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { stripeAccountId, stripeTransferId } = req.body;

    if (!stripeAccountId || !stripeTransferId) {
      res.status(400).json({ message: 'stripeAccountId and stripeTransferId are required.' }); return;
    }

    const transfer = await transferService.syncFromStripe(userId, stripeAccountId, stripeTransferId);
    res.status(200).json(transfer);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};
