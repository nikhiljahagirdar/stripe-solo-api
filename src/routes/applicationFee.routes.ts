import { Router } from 'express';
import { getApplicationFees, getApplicationFee, syncApplicationFee } from '../controllers/applicationFee.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/application-fees:
 *   get:
 *     summary: Get all application fees
 *     tags: [Application Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: An account ID to filter application fees.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: A year to filter application fees by creation date.
 *     responses:
 *       200:
 *         description: List of application fees
 */
router.get('/', authenticate, getApplicationFees);
router.get('/:id', authenticate, getApplicationFee);
router.post('/sync', authenticate, syncApplicationFee);

export default router;