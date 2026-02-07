import { Router } from 'express';
import { createSubscriptionSchedule, getSubscriptionSchedules, getSubscriptionSchedule, cancelSubscriptionSchedule } from '../controllers/subscriptionSchedule.controller';
import { authenticate } from '../middleware/authenticate';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

/**
 * @swagger
 * /api/subscription-schedules:
 *   post:
 *     summary: Create a new subscription schedule
 *     tags: [Subscription Schedules]
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
 *               phases:
 *                 type: array
 *     responses:
 *       201:
 *         description: Subscription schedule created successfully
 */
router.post('/', authenticate, checkRole(['admin', 'member']), createSubscriptionSchedule);
/**
 * @swagger
 * /api/subscription-schedules:
 *   get:
 *     summary: Get all subscription schedules
 *     tags: [Subscription Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter subscription schedules.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter subscription schedules by creation date.
 *     responses:
 *       200:
 *         description: List of subscription schedules
 */
router.get('/', authenticate, checkRole(['admin', 'member']), getSubscriptionSchedules);
router.get('/:id', authenticate, checkRole(['admin', 'member']), getSubscriptionSchedule);
router.post('/:id/cancel', authenticate, checkRole(['admin', 'member']), cancelSubscriptionSchedule);

export default router;