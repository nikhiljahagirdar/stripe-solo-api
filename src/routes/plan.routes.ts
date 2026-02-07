import { Router } from 'express';
import { createPlan, getPlans, getPlan, deletePlan } from '../controllers/plan.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/plans:
 *   post:
 *     summary: Create a new plan
 *     tags: [Plans]
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
 *               interval:
 *                 type: string
 *               product:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plan created successfully
 */
router.post('/', authenticate, createPlan);
router.get('/', authenticate, getPlans);
router.get('/:id', authenticate, getPlan);
router.delete('/:id', authenticate, deletePlan);

export default router;