import type { Request, Response, NextFunction } from 'express';
import { syncStripeAccount } from '../services/account.service';
import {checkUserHasKeys, createStripeKey, deleteStripeKey, getStripeKeysByUserId, updateStripeKey} from '../services/key.service';
import { getEffectiveUserId } from '../utils/user.utils';
import logger from '../utils/logger';
import { createNotification } from '../services/notification.service';
import { sendWebhook, getWebhookUrl, type WebhookPayload } from '../services/webhook.service';
import { emitNotificationToUser, emitSyncStatus } from '../services/socket.service';

/**
 * Request body for creating a Stripe key.
 * @typedef {object} CreateKeyBody
 * @property {string} name.required - A friendly name for the key.
 * @property {string} apiKey.required - The Stripe secret key (already encrypted from UI).
 */

/**
 * A Stripe Key object returned by the API (without sensitive data).
 * @typedef {object} StripeKeyResponse
 * @property {number} id - The internal ID of the key.
 * @property {number} userId - The ID of the user who owns the key.
 * @property {string} name - The friendly name of the key.
 * @property {string} createdAt - The creation timestamp.
 * @property {string} updatedAt - The last update timestamp.
 */

/**
 * Response payload for key creation with account sync.
 * @typedef {object} CreateKeyResponse
 * @property {StripeKeyResponse} key - The newly created key.
 * @property {number|null} accountId - The synced Stripe account ID, or null if sync failed.
 */

/**
 * POST /api/keys
 * @summary Create a new Stripe key
 * @description Creates and securely stores a new Stripe API key. It also triggers a sync of connected accounts associated with this key.
 * @tags Keys
 * @security BearerAuth
 * @param {CreateKeyBody} request.body.required - The details for the new key.
 * @return {CreateKeyResponse} 201 - The newly created key and synced account ID.
 * @example response - 201 - Success response
 * {
 *   "key": {
 *     "id": 10,
 *     "userId": 123,
 *     "name": "My Stripe Key",
 *     "createdAt": "2024-01-01T00:00:00.000Z",
 *     "updatedAt": "2024-01-01T00:00:00.000Z"
 *   },
 *   "accountId": 5
 * }
 * @return {object} 400 - Bad Request - Missing required fields.
 * @return {object} 401 - Unauthorized.
 * @return {object} 500 - Internal Server Error.
 */
export const createKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, apiKey } = req.body;
  const userId = await getEffectiveUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: User ID not found.' }); return;
  }

  if (!name || !apiKey) {
    res.status(400).json({ message: 'Name and API key are required.' }); return;
  }

  try {
    const newKey = await createStripeKey({ userId, name, apiKey });
    let syncedAccountId: number | null = null;
    
    // Emit sync started event
    emitSyncStatus(userId, {
      event: 'sync_started',
      keyName: name,
      message: 'Starting account sync...'
    });
    
    // Sync accounts from Stripe after key creation
    try {
      const syncedAccount = await syncStripeAccount(userId, newKey!.id);
      syncedAccountId = syncedAccount?.id ?? null;
      
      // Prepare webhook payload
      const webhookPayload: WebhookPayload = {
        event: 'sync_success',
        timestamp: new Date().toISOString(),
        userId,
        keyName: name,
        message: `Successfully synced Stripe accounts for key "${name}"`
      };
      
      // Emit real-time notification to UI via WebSocket
      emitNotificationToUser(userId, {
        type: 'sync_success',
        message: webhookPayload.message,
        keyName: name
      });
      
      // Emit sync completed status
      emitSyncStatus(userId, {
        event: 'sync_completed',
        keyName: name,
        progress: 100,
        message: 'Account synced successfully'
      });
      
      // Get webhook URL and send webhook
      const webhookUrl = await getWebhookUrl(userId);
      if (webhookUrl) {
        await sendWebhook(webhookUrl, webhookPayload);
      }
      
      // Also create notification in database as backup
      await createNotification({
        userId,
        type: 'sync_success',
        message: webhookPayload.message
      });
    } catch (syncError) {
      logger.error('Failed to sync Stripe accounts:', syncError);
      
      // Prepare failure webhook payload
      const webhookPayload: WebhookPayload = {
        event: 'sync_failure',
        timestamp: new Date().toISOString(),
        userId,
        keyName: name,
        message: `Failed to sync Stripe accounts for key "${name}". Please try again later.`
      };
      
      // Emit real-time failure notification to UI
      emitNotificationToUser(userId, {
        type: 'sync_failure',
        message: webhookPayload.message,
        keyName: name
      });
      
      // Emit sync failed status
      emitSyncStatus(userId, {
        event: 'sync_failed',
        keyName: name,
        message: 'Sync failed'
      });
      
      // Try to send webhook
      const webhookUrl = await getWebhookUrl(userId);
      if (webhookUrl) {
        await sendWebhook(webhookUrl, webhookPayload);
      }
      
      // Send failure notification
      await createNotification({
        userId,
        type: 'sync_failure',
        message: webhookPayload.message
      }).catch(notifError => {
        logger.error('Failed to create notification:', notifError);
      });
    }
    
    res.status(201).json({ key: newKey, accountId: syncedAccountId });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/keys
 * @summary Get all Stripe keys for the user
 * @description Retrieves a list of all Stripe keys associated with the authenticated user.
 * @tags Keys
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter Stripe keys by.
 * @param {number} [year] year.query - A year to filter Stripe keys by creation date.
 * @return {array<StripeKeyResponse>} 200 - An array of the user's key objects.
 * @return {object} 401 - Unauthorized.
 * @return {object} 500 - Internal Server Error.
 */
export const getKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = await getEffectiveUserId(req);
  const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
  const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const keys = await getStripeKeysByUserId(userId, accountId, year);
    res.status(200).json(keys);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/keys/check
 * @summary Check if the user has any Stripe keys
 * @description Checks if the authenticated user has at least one Stripe key registered. Returns a simple boolean status.
 * @tags Keys
 * @security BearerAuth
 * @return {object} 200 - A boolean indicating if keys exist.
 * @example response - 200 - success
 * {
 *   "hasKeys": true
 * }
 * @return {object} 401 - Unauthorized.
 * @return {object} 500 - Internal Server Error.
 */
export const checkHasKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = await getEffectiveUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const hasKeys = await checkUserHasKeys(userId);
    res.status(200).json({ hasKeys });
  } catch (error) {
    next(error);
  }
};

/**
 * Request body for updating a Stripe key. All fields are optional.
 * @typedef {object} UpdateKeyBody
 * @property {string} [name] - A new friendly name for the key.
 * @property {string} [apiKey] - A new Stripe secret key (already encrypted from UI).
 */

/**
 * PUT /api/keys/{id}
 * @summary Update a Stripe key
 * @description Updates the details of a specific Stripe key by its ID.
 * @tags Keys
 * @security BearerAuth
 * @param {number} id.path.required - The ID of the key to update.
 * @param {UpdateKeyBody} request.body.required - The fields to update.
 * @return {StripeKeyResponse} 200 - The updated key object.
 * @return {object} 401 - Unauthorized.
 * @return {object} 404 - Not Found - Key not found or user not authorized.
 * @return {object} 500 - Internal Server Error.
 */
export const updateKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = await getEffectiveUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const updatedKey = await updateStripeKey(Number(id), userId, updateData);
    res.status(200).json(updatedKey);
  } catch (error) {
    // Handle not found from service
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ message: error.message }); return;
    }
    next(error);
  }
};

/**
 * DELETE /api/keys/{id}
 * @summary Delete a Stripe key
 * @description Deletes a specific Stripe key by its ID.
 * @tags Keys
 * @security BearerAuth
 * @param {number} id.path.required - The ID of the key to delete.
 * @return {object} 200 - Success response with a confirmation message.
 * @return {object} 401 - Unauthorized.
 * @return {object} 404 - Not Found - Key not found or user not authorized.
 * @return {object} 500 - Internal Server Error.
 */
export const deleteKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = await getEffectiveUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: User ID not found.' }); return;
  }

  try {
    const result = await deleteStripeKey(Number(id), userId);
    res.status(200).json(result);
  } catch (error) {
    // Handle not found from service
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ message: error.message }); return;
    }
    next(error);
  }
};
