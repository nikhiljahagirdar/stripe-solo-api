import { Router } from 'express';
import { createPrice, getAllPrices, getPriceById, updatePrice, listAllPricesWithProducts } from '../controllers/price.controller';


const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Price:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         stripePriceId:
 *           type: string
 *         stripeProductId:
 *           type: string
 *         unitAmount:
 *           type: integer
 *         currency:
 *           type: string
 *         recurringInterval:
 *           type: string
 *         active:
 *           type: boolean
 */

/**
 * @swagger
 * /api/prices:
 *   post:
 *     summary: Create a new price
 *     tags: [Prices]
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
 *               product:
 *                 type: string
 *               unit_amount:
 *                 type: integer
 *               currency:
 *                 type: string
 *               recurring:
 *                 type: object
 *     responses:
 *       201:
 *         description: Price created successfully
 *       400:
 *         description: Bad request
 */
router.post('/',  createPrice);

/**
 * @swagger
 * /api/prices:
 *   get:
 *     summary: Get all prices
 *     tags: [Prices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter prices.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter prices by creation date.
 *     responses:
 *       200:
 *         description: List of prices
 */
router.get('/',  getAllPrices);

/**
 * GET /api/v1/prices/list-all
 * @summary List all prices with product names
 * @tags Prices
 * @return {array<object>} 200 - List of all prices with product names
 * @return {object} 500 - Internal Server Error
 */
router.get('/list-all', listAllPricesWithProducts);

/**
 * @swagger
 * /api/prices/{id}:
 *   get:
 *     summary: Get price by ID
 *     tags: [Prices]
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
 *         description: Price details
 *       404:
 *         description: Price not found
 */
router.get('/:id', getPriceById);

/**
 * @swagger
 * /api/prices/{id}:
 *   put:
 *     summary: Update price
 *     tags: [Prices]
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
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Price updated successfully
 *       404:
 *         description: Price not found
 */
router.put('/:id',  updatePrice);

export default router;