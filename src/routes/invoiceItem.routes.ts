import { Router } from 'express';
import { createInvoiceItem, getInvoiceItems, getInvoiceItem, updateInvoiceItem, deleteInvoiceItem } from '../controllers/invoiceItem.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/invoice-items:
 *   post:
 *     summary: Create a new invoice item
 *     tags: [Invoice Items]
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
 *               amount:
 *                 type: integer
 *               currency:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice item created successfully
 */
router.post('/', authenticate, createInvoiceItem);

/**
 * @swagger
 * /api/invoice-items:
 *   get:
 *     summary: Get all invoice items
 *     tags: [Invoice Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter invoice items.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter invoice items by creation date.
 *     responses:
 *       200:
 *         description: List of invoice items
 */
router.get('/', authenticate, getInvoiceItems);

/**
 * @swagger
 * /api/invoice-items/{id}:
 *   get:
 *     summary: Get invoice item by ID
 *     tags: [Invoice Items]
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
 *         description: Invoice item details
 */
router.get('/:id', authenticate, getInvoiceItem);

/**
 * @swagger
 * /api/invoice-items/{id}:
 *   put:
 *     summary: Update invoice item
 *     tags: [Invoice Items]
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice item updated successfully
 */
router.put('/:id', authenticate, updateInvoiceItem);

/**
 * @swagger
 * /api/invoice-items/{id}:
 *   delete:
 *     summary: Delete invoice item
 *     tags: [Invoice Items]
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
 *         description: Invoice item deleted successfully
 */
router.delete('/:id', authenticate, deleteInvoiceItem);

export default router;