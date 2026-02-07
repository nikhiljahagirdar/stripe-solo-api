import { Router } from 'express';
import { createSetupIntent, getAllSetupIntents, getSetupIntentById, confirmSetupIntent, cancelSetupIntent } from '../controllers/setupIntent.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/setup-intents:
 *   post:
 *     summary: Create a new setup intent
 *     tags: [Setup Intents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *               customer:
 *                 type: string
 *               usage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Setup intent created successfully
 */
router.post('/', authenticate, createSetupIntent);

/**
 * @swagger
 * /api/setup-intents:
 *   get:
 *     summary: Get all setup intents
 *     tags: [Setup Intents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter setup intents.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter setup intents by creation date.
 *     responses:
 *       200:
 *         description: List of setup intents
 */
router.get('/', authenticate, getAllSetupIntents);

/**
 * @swagger
 * /api/setup-intents/{id}:
 *   get:
 *     summary: Get setup intent by ID
 *     tags: [Setup Intents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Setup intent details
 */
router.get('/:id', authenticate, getSetupIntentById);

/**
 * @swagger
 * /api/setup-intents/{id}/confirm:
 *   post:
 *     summary: Confirm setup intent
 *     tags: [Setup Intents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *               payment_method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setup intent confirmed
 */
router.post('/:id/confirm', authenticate, confirmSetupIntent);

/**
 * @swagger
 * /api/setup-intents/{id}/cancel:
 *   post:
 *     summary: Cancel setup intent
 *     tags: [Setup Intents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stripeAccountId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Setup intent canceled
 */
router.post('/:id/cancel', authenticate, cancelSetupIntent);

export default router;