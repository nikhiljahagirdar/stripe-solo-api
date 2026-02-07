import { Router } from 'express';
import { createSubscriptionItem, getSubscriptionItems, getSubscriptionItem, updateSubscriptionItem, deleteSubscriptionItem } from '../controllers/subscriptionItem.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/subscription-items:
 *   post:
 *     summary: Create a new subscription item
 *     tags: [Subscription Items]
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
 *               subscription:
 *                 type: string
 *               price:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Subscription item created successfully
 */
router.post('/', authenticate, createSubscriptionItem);

/**
 * @swagger
 * /api/subscription-items:
 *   get:
 *     summary: Get all subscription items
 *     tags: [Subscription Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter subscription items.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter subscription items by creation date.
 *     responses:
 *       200:
 *         description: List of subscription items
 */
router.get('/', authenticate, getSubscriptionItems);

/**
 * @swagger
 * /api/subscription-items/{id}:
 *   get:
 *     summary: Get subscription item by ID
 *     tags: [Subscription Items]
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
 *         description: Subscription item details
 */
router.get('/:id', authenticate, getSubscriptionItem);

/**
 * @swagger
 * /api/subscription-items/{id}:
 *   put:
 *     summary: Update subscription item
 *     tags: [Subscription Items]
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
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Subscription item updated successfully
 */
router.put('/:id', authenticate, updateSubscriptionItem);

/**
 * @swagger
 * /api/subscription-items/{id}:
 *   delete:
 *     summary: Delete subscription item
 *     tags: [Subscription Items]
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
 *       204:
 *         description: Subscription item deleted successfully
 */
router.delete('/:id', authenticate, deleteSubscriptionItem);

export default router;