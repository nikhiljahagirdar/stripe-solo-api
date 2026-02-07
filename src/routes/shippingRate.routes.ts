import { Router } from 'express';
import { createShippingRate, getShippingRates, getShippingRate, updateShippingRate } from '../controllers/shippingRate.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/shipping-rates:
 *   post:
 *     summary: Create a new shipping rate
 *     tags: [Shipping Rates]
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
 *               display_name:
 *                 type: string
 *               fixed_amount:
 *                 type: object
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shipping rate created successfully
 */
router.post('/', authenticate, createShippingRate);
router.get('/', authenticate, getShippingRates);
router.get('/:id', authenticate, getShippingRate);
router.put('/:id', authenticate, updateShippingRate);

export default router;