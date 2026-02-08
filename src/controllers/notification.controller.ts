import type { Request, Response } from 'express';
import { getNotificationById, listNotifications, setNotificationReadState } from '../services/notification.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Notification creation request.
 * @typedef {object} CreateNotificationRequest
 * @property {string} type.required - Type of notification (info, warning, error, success)
 * @property {string} message.required - Notification message
 * @property {object} metadata - Additional metadata
 */

/**
 * Notification object.
 * @typedef {object} Notification
 * @property {integer} id - Unique identifier for the notification
 * @property {integer} userId - User ID this notification belongs to
 * @property {string} type - Type of notification
 * @property {string} message - Notification message
 * @property {boolean} isRead - Whether the notification has been read
 * @property {number} createdAt - Time at which the notification was created
 */

/**
 * Notifications list response.
 * @typedef {object} NotificationsListResponse
 * @property {array<Notification>} data - Notifications for the current page
 * @property {number} total - Total number of notifications
 * @property {number} page - Current page number
 * @property {number} pageSize - Number of items per page
 * @property {number} totalPages - Total number of pages
 */

/**
 * Update read status request.
 * @typedef {object} UpdateNotificationReadRequest
 * @property {boolean} isRead.required - Whether the notification is read
 */

/**
 * POST /api/v1/notifications
 * @summary Create a new notification
 * @description Creates a notification for the authenticated user
 * @tags Notifications
 * @security BearerAuth
 * @param {CreateNotificationRequest} request.body.required - Notification creation data
 * @return {Notification} 201 - Notification created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createNotification = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Placeholder implementation - notification creation not implemented in service
    res.status(501).json({ error: 'Notification creation not implemented' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/notifications
 * @summary List all notifications for the authenticated user
 * @description Retrieves notifications for the user with pagination
 * @tags Notifications
 * @security BearerAuth
 * @param {integer} [page=1] page.query - Page number
 * @param {integer} [pageSize=10] pageSize.query - Items per page (max: 100)
 * @param {boolean} unread_only.query - Filter to show only unread notifications
 * @return {NotificationsListResponse} 200 - List of notifications
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user?.id) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const page = Math.max(1, Number(req.query['page'] || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(req.query['pageSize'] || '10')));
    const unreadOnly = String(req.query['unread_only'] ?? '').toLowerCase() === 'true';

    const result = await listNotifications(user.id, { page, pageSize, unreadOnly });
    res.json({
      data: result.notifications,
      total: result.totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(result.totalCount / pageSize)
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/notifications/{id}
 * @summary Retrieve a specific notification
 * @description Retrieves the details of a notification
 * @tags Notifications
 * @security BearerAuth
 * @param {integer} id.path.required - Notification ID
 * @return {Notification} 200 - Notification details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Notification not found
 * @return {object} 500 - Internal Server Error
 */
export const getNotification = async (_req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(_req);
    if (!user?.id) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }

    const notificationId = Number(_req.params['id']);
    if (!notificationId || Number.isNaN(notificationId)) {
      res.status(400).json({ error: 'Invalid notification ID' }); return;
    }

    const notification = await getNotificationById(user.id, notificationId);
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' }); return;
    }

    res.status(200).json(notification);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * PATCH /api/v1/notifications/{id}/read
 * @summary Set notification read/unread
 * @description Updates the read status of a notification
 * @tags Notifications
 * @security BearerAuth
 * @param {integer} id.path.required - Notification ID
 * @param {UpdateNotificationReadRequest} request.body.required - Read status update
 * @return {Notification} 200 - Notification updated successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Notification not found
 * @return {object} 500 - Internal Server Error
 */
export const setNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user?.id) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }

    const notificationId = Number(req.params['id']);
    if (!notificationId || Number.isNaN(notificationId)) {
      res.status(400).json({ error: 'Invalid notification ID' }); return;
    }

    const { isRead } = req.body as { isRead?: boolean };
    if (typeof isRead !== 'boolean') {
      res.status(400).json({ error: 'isRead must be a boolean' }); return;
    }

    const updated = await setNotificationReadState(user.id, notificationId, isRead);
    if (!updated) {
      res.status(404).json({ error: 'Notification not found' }); return;
    }

    res.status(200).json(updated);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * DELETE /api/v1/notifications/cleanup
 * @summary Clean up old notifications
 * @description Deletes notifications older than specified number of days
 * @tags Notifications
 * @security BearerAuth
 * @param {object} request.body.required - Cleanup parameters
 * @param {integer} request.body.daysOld - Number of days old (default: 30)
 * @return {object} 200 - Cleanup completed
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const cleanupNotifications = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Placeholder implementation - cleanup not implemented in service
    res.status(501).json({ error: 'Notification cleanup not implemented' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
