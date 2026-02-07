import { Router } from 'express';
import { createTopUp, getTopUps, getTopUp } from '../controllers/topUp.controller';
import { authenticate } from '../middleware/authenticate';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

/**
 * @swagger
 * /api/top-ups:
 *   post:
 *     summary: Create a new top up
 *     tags: [Top Ups]
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
 *     responses:
 *       201:
 *         description: Top up created successfully
 */
router.post('/', authenticate, checkRole(['admin', 'member']), createTopUp);
router.get('/', authenticate, checkRole(['admin', 'member']), getTopUps);
router.get('/:id', authenticate, checkRole(['admin', 'member']), getTopUp);

export default router;