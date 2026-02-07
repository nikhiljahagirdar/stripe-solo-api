import { Router } from 'express';
import { createCustomerSession, getCustomerSessions, getCustomerSession } from '../controllers/customerSession.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/customer-sessions:
 *   post:
 *     summary: Create a new customer session
 *     tags: [Customer Sessions]
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
 *               components:
 *                 type: object
 *     responses:
 *       201:
 *         description: Customer session created successfully
 */
router.post('/', authenticate, createCustomerSession);
router.get('/', authenticate, getCustomerSessions);
router.get('/:id', authenticate, getCustomerSession);

export default router;