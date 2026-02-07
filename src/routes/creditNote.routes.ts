import { Router } from 'express';
import { createCreditNote, getCreditNotes, getCreditNote, voidCreditNote } from '../controllers/creditNote.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/credit-notes:
 *   post:
 *     summary: Create a new credit note
 *     tags: [Credit Notes]
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
 *               invoice:
 *                 type: string
 *               amount:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Credit note created successfully
 */
router.post('/', authenticate, createCreditNote);
router.get('/', authenticate, getCreditNotes);
router.get('/:id', authenticate, getCreditNote);
router.post('/:id/void', authenticate, voidCreditNote);

export default router;