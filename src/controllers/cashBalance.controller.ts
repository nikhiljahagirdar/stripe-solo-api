import type { Request, Response } from 'express';
import { CashBalanceService } from '../services/cashBalance.service';

/**
 * @swagger
 * components:
 *   schemas:
 *     CashBalance:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The unique identifier for the cash balance record.
 *           example: 1
 *         userId:
 *           type: integer
 *           description: The ID of the user who owns this record.
 *           example: 101
 *         stripeAccountId:
 *           type: integer
 *           description: The database ID of the associated Stripe account.
 *           example: 2
 *         stripeCustomerId:
 *           type: string
 *           description: The Stripe Customer ID.
 *           example: "cus_ABC123"
 *         available:
 *           type: number
 *           description: The available cash balance amount.
 *           example: 5000
 *         currency:
 *           type: string
 *           description: The three-letter ISO currency code.
 *           example: "usd"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the record was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the record was last updated.
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: A message describing the error.
 */

const cashBalanceService = new CashBalanceService();

/**
 * @swagger
 * /cash-balances/sync:
 *   post:
 *     summary: Sync cash balance from Stripe
 *     tags: [CashBalance]
 *     description: Retrieves a customer's cash balance from Stripe and updates the local database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stripeAccountId
 *               - stripeCustomerId
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *                 description: The database ID of the Stripe account to use for the API call.
 *                 example: 2
 *               stripeCustomerId:
 *                 type: string
 *                 description: The Stripe Customer ID whose cash balance is to be synced.
 *                 example: "cus_ABC123"
 *     responses:
 *       '200':
 *         description: Successfully synced and returned the cash balance record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashBalance'
 *       '400':
 *         description: Bad request, missing required parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const syncCashBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    // Assuming userId is available from auth middleware, e.g., req.user.id
    const userId = 1; // Placeholder
    const { stripeAccountId, stripeCustomerId } = req.body;

    if (!stripeAccountId || !stripeCustomerId) {
      res.status(400).json({ message: 'stripeAccountId and stripeCustomerId are required.' }); return;
    }

    const cashBalance = await cashBalanceService.syncFromStripe(userId, stripeAccountId, stripeCustomerId);
    res.status(200).json(cashBalance);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /cash-balances:
 *   get:
 *     summary: Get all cash balances for a user
 *     tags: [CashBalance]
 *     description: Retrieves a list of all cash balances associated with the authenticated user.
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
 *         description: A list of cash balances.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CashBalance'
 *       '500':
 *         description: Internal server error.
 */
export const getAllCashBalances = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const cashBalances = await cashBalanceService.findByUser(userId, accountId, year);
    res.status(200).json(cashBalances);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /cash-balances/{id}:
 *   get:
 *     summary: Get a single cash balance by ID
 *     tags: [CashBalance]
 *     description: Retrieves a specific cash balance by its database ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the cash balance to retrieve.
 *     responses:
 *       '200':
 *         description: The requested cash balance.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashBalance'
 *       '404':
 *         description: Cash balance not found.
 *       '500':
 *         description: Internal server error.
 */
export const getCashBalanceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'ID is required.' });
      return;
    }

    const cashBalance = await cashBalanceService.findById(userId, +id);

    if (!cashBalance) {
      res.status(404).json({ message: 'Cash balance not found.' }); return;
    }

    res.status(200).json(cashBalance);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};
