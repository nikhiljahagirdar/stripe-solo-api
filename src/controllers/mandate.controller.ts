import type { Request, Response } from 'express';
import { MandateService } from '../services/mandate.service';

/**
 * @swagger
 * components:
 *   schemas:
 *     Mandate:
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
 *         stripeMandateId:
 *           type: string
 *           example: "mandate_123"
 *         stripeCustomerId:
 *           type: string
 *           nullable: true
 *           example: "cus_123"
 *         type:
 *           type: string
 *           example: "multi_use"
 *         status:
 *           type: string
 *           example: "active"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */

const mandateService = new MandateService();

/**
 * @swagger
 * /mandates/sync:
 *   post:
 *     summary: Sync a mandate from Stripe
 *     tags: [Mandates]
 *     description: Retrieves a mandate from Stripe and creates or updates it in the local database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeAccountId, stripeMandateId]
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *                 description: The database ID of the Stripe account to use.
 *                 example: 2
 *               stripeMandateId:
 *                 type: string
 *                 description: The ID of the Stripe Mandate to sync.
 *                 example: "mandate_1MowSFLkdIwHu7ixsOQdD3r2"
 *     responses:
 *       '200':
 *         description: Mandate synced successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mandate'
 *       '400':
 *         description: Bad request.
 *       '500':
 *         description: Internal server error.
 */
export const syncMandate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { stripeAccountId, stripeMandateId } = req.body;

    if (!stripeAccountId || !stripeMandateId) {
      res.status(400).json({ message: 'stripeAccountId and stripeMandateId are required.' }); return;
    }

    const mandate = await mandateService.syncFromStripe(userId, stripeAccountId, stripeMandateId);
    res.status(200).json(mandate);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /mandates:
 *   get:
 *     summary: Get all mandates for a user
 *     tags: [Mandates]
 *     description: Retrieves a list of all mandates associated with the authenticated user.
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
 *         description: A list of mandates.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mandate'
 *       '500':
 *         description: Internal server error.
 */
export const getAllMandates = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const mandates = await mandateService.findByUser(userId, accountId, year);
    res.status(200).json(mandates);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * @swagger
 * /mandates/{id}:
 *   get:
 *     summary: Get a single mandate by ID
 *     tags: [Mandates]
 *     description: Retrieves a specific mandate by its database ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the mandate to retrieve.
 *     responses:
 *       '200':
 *         description: The requested mandate.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mandate'
 *       '404':
 *         description: Mandate not found.
 *       '500':
 *         description: Internal server error.
 */
export const getMandateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 1; // Placeholder for auth
    const { id } = req.params;

    const mandate = await mandateService.findById(userId, +id!);

    if (!mandate) {
      res.status(404).json({ message: 'Mandate not found.' }); return;
    }

    res.status(200).json(mandate);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};
