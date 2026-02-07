import type { Request, Response } from 'express';
import {
  getUserSettings,
  getUserSettingsWithDetails,
  getUserSettingById,
  createUserSetting,
  updateUserSetting,
  upsertUserSetting,
  deleteUserSetting,
  deleteAllUserSettings,
} from '../services/userSettings.service';
import { getSettingById } from '../services/settings.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * GET /api/user-settings
 * @summary Get all user settings for authenticated user
 * @tags User Settings
 * @security bearerAuth
 * @return {array<object>} 200 - List of user settings
 * @example response - 200 - Success response
 *   [{
 *     "id": 1,
 *     "userId": 1,
 *     "settingId": 1,
 *     "value": "custom_value",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T10:00:00Z"
 *   }]
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal server error
 */
export const getUserSettingsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const userSettings = await getUserSettings(user.id);
    res.status(200).json(userSettings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
};

/**
 * GET /api/user-settings/detailed
 * @summary Get all user settings with setting details for authenticated user
 * @tags User Settings
 * @security bearerAuth
 * @return {array<object>} 200 - List of user settings with details
 * @example response - 200 - Success response
 *   [{
 *     "id": 1,
 *     "userId": 1,
 *     "settingId": 1,
 *     "value": "custom_value",
 *     "settingKey": "site_name",
 *     "settingDefaultValue": "Default Site Name",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T10:00:00Z"
 *   }]
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal server error
 */
export const getUserSettingsWithDetailsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const userSettings = await getUserSettingsWithDetails(user.id);
    res.status(200).json(userSettings);
  } catch (error) {
    console.error('Error fetching user settings with details:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
};

/**
 * GET /api/user-settings/{id}
 * @summary Get a user setting by ID
 * @tags User Settings
 * @security bearerAuth
 * @param {integer} id.path.required - User setting ID
 * @return {object} 200 - User setting found
 * @example response - 200 - Success response
 *   {
 *     "id": 1,
 *     "userId": 1,
 *     "settingId": 1,
 *     "value": "custom_value",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T10:00:00Z"
 *   }
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - User setting not found
 * @return {object} 500 - Internal server error
 */
export const getUserSettingByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { id } = req.params;
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const userSetting = await getUserSettingById(Number(id), user.id);
    
    if (!userSetting) {
      res.status(404).json({ error: 'User setting not found' });
      return;
    }
    
    res.status(200).json(userSetting);
  } catch (error) {
    console.error('Error fetching user setting:', error);
    res.status(500).json({ error: 'Failed to fetch user setting' });
  }
};

/**
 * POST /api/user-settings
 * @summary Create a new user setting
 * @tags User Settings
 * @security bearerAuth
 * @param {object} request.body.required - User setting data
 * @param {integer} request.body.settingId.required - Setting ID
 * @param {string} request.body.value.required - Setting value
 * @example request - Request body example
 *   {
 *     "settingId": 1,
 *     "value": "my_custom_value"
 *   }
 * @return {object} 201 - User setting created successfully
 * @example response - 201 - Success response
 *   {
 *     "id": 1,
 *     "userId": 1,
 *     "settingId": 1,
 *     "value": "my_custom_value",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T10:00:00Z"
 *   }
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
export const createUserSettingController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { settingId, value } = req.body;
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (!settingId || value === undefined) {
      res.status(400).json({ error: 'settingId and value are required' });
      return;
    }
    
    // Verify setting exists
    const setting = await getSettingById(Number(settingId));
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    const newUserSetting = await createUserSetting({
      userId: user.id,
      settingId: Number(settingId),
      value,
    });
    
    res.status(201).json(newUserSetting);
  } catch (error) {
    console.error('Error creating user setting:', error);
    res.status(500).json({ error: 'Failed to create user setting' });
  }
};

/**
 * PUT /api/user-settings/{id}
 * @summary Update a user setting
 * @tags User Settings
 * @security bearerAuth
 * @param {integer} id.path.required - User setting ID
 * @param {object} request.body.required - User setting data
 * @param {string} request.body.value.required - New value
 * @example request - Request body example
 *   {
 *     "value": "updated_custom_value"
 *   }
 * @return {object} 200 - User setting updated successfully
 * @example response - 200 - Success response
 *   {
 *     "id": 1,
 *     "userId": 1,
 *     "settingId": 1,
 *     "value": "updated_custom_value",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T15:30:00Z"
 *   }
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - User setting not found
 * @return {object} 500 - Internal server error
 */
export const updateUserSettingController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { id } = req.params;
    const { value } = req.body;
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (value === undefined) {
      res.status(400).json({ error: 'value is required' });
      return;
    }
    
    const existing = await getUserSettingById(Number(id), user.id);
    if (!existing) {
      res.status(404).json({ error: 'User setting not found' });
      return;
    }
    
    const updated = await updateUserSetting(Number(id), user.id, { value });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating user setting:', error);
    res.status(500).json({ error: 'Failed to update user setting' });
  }
};

/**
 * POST /api/user-settings/upsert
 * @summary Create or update a user setting
 * @tags User Settings
 * @security bearerAuth
 * @param {object} request.body.required - User setting data
 * @param {integer} request.body.settingId.required - Setting ID
 * @param {string} request.body.value.required - Setting value
 * @example request - Request body example
 *   {
 *     "settingId": 1,
 *     "value": "my_value"
 *   }
 * @return {object} 200 - User setting created or updated successfully
 * @example response - 200 - Success response
 *   {
 *     "id": 1,
 *     "userId": 1,
 *     "settingId": 1,
 *     "value": "my_value",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T15:30:00Z"
 *   }
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
export const upsertUserSettingController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { settingId, value } = req.body;
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (!settingId || value === undefined) {
      res.status(400).json({ error: 'settingId and value are required' });
      return;
    }
    
    // Verify setting exists
    const setting = await getSettingById(Number(settingId));
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    const userSetting = await upsertUserSetting(user.id, Number(settingId), value);
    res.status(200).json(userSetting);
  } catch (error) {
    console.error('Error upserting user setting:', error);
    res.status(500).json({ error: 'Failed to upsert user setting' });
  }
};

/**
 * DELETE /api/user-settings/{id}
 * @summary Delete a user setting
 * @tags User Settings
 * @security bearerAuth
 * @param {integer} id.path.required - User setting ID
 * @return {object} 200 - User setting deleted successfully
 * @example response - 200 - Success response
 *   {
 *     "id": 1,
 *     "deleted": true
 *   }
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - User setting not found
 * @return {object} 500 - Internal server error
 */
export const deleteUserSettingController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { id } = req.params;
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const existing = await getUserSettingById(Number(id), user.id);
    if (!existing) {
      res.status(404).json({ error: 'User setting not found' });
      return;
    }
    
    const deleted = await deleteUserSetting(Number(id), user.id);
    
    if (deleted) {
      res.status(200).json({ id: Number(id), deleted: true }); return;
    } else {
      res.status(500).json({ error: 'Failed to delete user setting' });
    }
  } catch (error) {
    console.error('Error deleting user setting:', error);
    res.status(500).json({ error: 'Failed to delete user setting' });
  }
};

/**
 * DELETE /api/user-settings
 * @summary Delete all user settings for authenticated user
 * @tags User Settings
 * @security bearerAuth
 * @return {object} 200 - User settings deleted successfully
 * @example response - 200 - Success response
 *   {
 *     "deleted": 5
 *   }
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal server error
 */
export const deleteAllUserSettingsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const deletedCount = await deleteAllUserSettings(user.id);
    res.status(200).json({ deleted: deletedCount });
  } catch (error) {
    console.error('Error deleting all user settings:', error);
    res.status(500).json({ error: 'Failed to delete user settings' });
  }
};
