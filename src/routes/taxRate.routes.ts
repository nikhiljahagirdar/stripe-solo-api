import { Router } from 'express';
import { createTaxRate, getTaxRates, getTaxRate, updateTaxRate } from '../controllers/taxRate.controller';
import { authenticate } from '../middleware/authenticate';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

/**
 * @swagger
 * /api/tax-rates:
 *   post:
 *     summary: Create a new tax rate
 *     tags: [Tax Rates]
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
 *               percentage:
 *                 type: number
 *               inclusive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tax rate created successfully
 */
router.post('/', authenticate, checkRole(['admin', 'member']), createTaxRate);
router.get('/', authenticate, checkRole(['admin', 'member']), getTaxRates);
router.get('/:id', authenticate, checkRole(['admin', 'member']), getTaxRate);
router.put('/:id', authenticate, checkRole(['admin', 'member']), updateTaxRate);

export default router;