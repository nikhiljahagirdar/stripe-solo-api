import { Router } from 'express';
import { getAllMandates, getMandateById, syncMandate } from '../controllers/mandate.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/mandates:
 *   get:
 *     summary: Get all mandates
 *     tags: [Mandates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter mandates.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter mandates by creation date.
 *     responses:
 *       200:
 *         description: List of mandates
 */
router.get('/', authenticate, getAllMandates);

/**
 * @swagger
 * /api/mandates/{id}:
 *   get:
 *     summary: Get mandate by ID
 *     tags: [Mandates]
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
 *         description: Mandate details
 */
router.get('/:id', authenticate, getMandateById);

/**
 * @swagger
 * /api/mandates/sync:
 *   post:
 *     summary: Sync mandate from Stripe
 *     tags: [Mandates]
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
 *               stripeMandateId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mandate synced successfully
 */
router.post('/sync', authenticate, syncMandate);

export default router;