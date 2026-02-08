import { Router } from 'express';
import { createNotification, getNotifications, getNotification, cleanupNotifications, setNotificationRead } from '../controllers/notification.controller';
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

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications with pagination
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only unread notifications
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authenticate, getNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get a notification by ID
 *     tags: [Notifications]
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
 *         description: Notification details
 *       404:
 *         description: Notification not found
 */
router.get('/:id', authenticate, getNotification);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Set notification read/unread
 *     tags: [Notifications]
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
 *               isRead:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification updated
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', authenticate, setNotificationRead);

/**
 * @swagger
 * /api/notifications/cleanup:
 *   post:
 *     summary: Clean up old notifications
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
 *               daysOld:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: Cleanup completed
 */
router.post('/cleanup', authenticate, cleanupNotifications);

export default router;