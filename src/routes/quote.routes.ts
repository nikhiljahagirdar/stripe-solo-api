import { Router } from 'express';
import { createQuote, getQuotes, getQuote, finalizeQuote, acceptQuote, cancelQuote } from '../controllers/quote.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/quotes:
 *   post:
 *     summary: Create a new quote
 *     tags: [Quotes]
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
 *               line_items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Quote created successfully
 */
router.post('/', authenticate, createQuote);

/**
 * @swagger
 * /api/quotes:
 *   get:
 *     summary: Get all quotes
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter quotes.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter quotes by creation date.
 *     responses:
 *       200:
 *         description: List of quotes
 */
router.get('/', authenticate, getQuotes);

/**
 * @swagger
 * /api/quotes/{id}:
 *   get:
 *     summary: Get quote by ID
 *     tags: [Quotes]
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
 *         description: Quote details
 */
router.get('/:id', authenticate, getQuote);

/**
 * @swagger
 * /api/quotes/{id}/finalize:
 *   post:
 *     summary: Finalize quote
 *     tags: [Quotes]
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
 *         description: Quote finalized successfully
 */
router.post('/:id/finalize', authenticate, finalizeQuote);

/**
 * @swagger
 * /api/quotes/{id}/accept:
 *   post:
 *     summary: Accept quote
 *     tags: [Quotes]
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
 *         description: Quote accepted successfully
 */
router.post('/:id/accept', authenticate, acceptQuote);

/**
 * @swagger
 * /api/quotes/{id}/cancel:
 *   post:
 *     summary: Cancel quote
 *     tags: [Quotes]
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
 *         description: Quote canceled successfully
 */
router.post('/:id/cancel', authenticate, cancelQuote);

export default router;