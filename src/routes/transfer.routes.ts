import { Router } from 'express';
import { createTransfer, getAllTransfers, getTransferById, reverseTransfer, syncTransfer } from '../controllers/transfer.controller';
import { authenticate } from '../middleware/authenticate';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

/**
 * @swagger
 * /api/transfers:
 *   post:
 *     summary: Create a new transfer
 *     tags: [Transfers]
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
 *               amount:
 *                 type: integer
 *               currency:
 *                 type: string
 *               destination:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer created successfully
 */
router.post('/', authenticate, checkRole(['admin', 'member']), createTransfer);

/**
 * @swagger
 * /api/transfers:
 *   get:
 *     summary: Get all transfers
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter transfers.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter transfers by creation date.
 *     responses:
 *       200:
 *         description: List of transfers
 */
router.get('/', authenticate, checkRole(['admin', 'member']), getAllTransfers);

/**
 * @swagger
 * /api/transfers/{id}:
 *   get:
 *     summary: Get transfer by ID
 *     tags: [Transfers]
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
 *         description: Transfer details
 */
router.get('/:id', authenticate, checkRole(['admin', 'member']), getTransferById);

/**
 * @swagger
 * /api/transfers/{id}/reverse:
 *   post:
 *     summary: Reverse a transfer
 *     tags: [Transfers]
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
 *               amount:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Transfer reversed successfully
 */
router.post('/:id/reverse', authenticate, checkRole(['admin', 'member']), reverseTransfer);

/**
 * @swagger
 * /api/transfers/sync:
 *   post:
 *     summary: Sync transfer from Stripe
 *     tags: [Transfers]
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
 *               stripeTransferId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer synced successfully
 */
router.post('/sync', authenticate, checkRole(['admin', 'member']), syncTransfer);

export default router;