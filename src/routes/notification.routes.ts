import { Router } from 'express';
import { createNotification, getNotifications, getNotification, cleanupNotifications } from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [sync_success, sync_failure, sync_partial]
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created successfully
 */
router.post('/', authenticate, createNotification);
router.get('/', authenticate, getNotifications);
router.get('/:id', authenticate, getNotification);
router.post('/cleanup', authenticate, cleanupNotifications);

export default router;