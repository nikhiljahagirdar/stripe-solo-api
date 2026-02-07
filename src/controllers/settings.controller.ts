import type { Request, Response } from 'express';
import {
  getAllSettings,
  getSettingById,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting,
} from '../services/settings.service';

/**
 * GET /api/settings
 * @summary Get all settings
 * @tags Settings
 * @return {array<object>} 200 - List of settings
 * @example response - 200 - Success response
 *   [{
 *     "settingsId": 1,
 *     "key": "site_name",
 *     "value": "My Site",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T10:00:00Z"
 *   }]
 * @return {object} 500 - Internal server error
 */
export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getAllSettings();
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

/**
 * GET /api/settings/{id}
 * @summary Get a setting by ID
 * @tags Settings
 * @param {integer} id.path.required - Setting ID
 * @return {object} 200 - Setting found
 * @example response - 200 - Success response
 *   {
 *     "settingsId": 1,
 *     "key": "site_name",
 *     "value": "My Site",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T10:00:00Z"
 *   }
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
export const getSettingByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const setting = await getSettingById(Number(id));
    
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    res.status(200).json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
};

/**
 * GET /api/settings/key/{key}
 * @summary Get a setting by key
 * @tags Settings
 * @param {string} key.path.required - Setting key
 * @return {object} 200 - Setting found
 * @example response - 200 - Success response
 *   {
 *     "settingsId": 1,
 *     "key": "site_name",
 *     "value": "My Site",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T10:00:00Z"
 *   }
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
export const getSettingByKeyController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const setting = await getSettingByKey(String(key));
    
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    res.status(200).json(setting);
  } catch (error) {
    console.error('Error fetching setting by key:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
};

/**
 * POST /api/settings
 * @summary Create a new setting
 * @tags Settings
 * @param {object} request.body.required - Setting data
 * @param {string} request.body.key.required - Setting key
 * @param {string} request.body.value.required - Setting value
 * @example request - Request body example
 *   {
 *     "key": "site_name",
 *     "value": "My Awesome Site"
 *   }
 * @return {object} 201 - Setting created successfully
 * @example response - 201 - Success response
 *   {
 *     "settingsId": 1,
 *     "key": "site_name",
 *     "value": "My Awesome Site",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T10:00:00Z"
 *   }
 * @return {object} 400 - Invalid input
 * @return {object} 500 - Internal server error
 */
export const createSettingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value } = req.body;
    
    if (!key || !value) {
      res.status(400).json({ error: 'Key and value are required' });
      return;
    }
    
    // Check if key already exists
    const existing = await getSettingByKey(key);
    if (existing) {
      res.status(400).json({ error: 'Setting with this key already exists' });
      return;
    }
    
    const newSetting = await createSetting({ key, value });
    res.status(201).json(newSetting);
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
};

/**
 * PUT /api/settings/{id}
 * @summary Update a setting
 * @tags Settings
 * @param {integer} id.path.required - Setting ID
 * @param {object} request.body.required - Setting data
 * @param {string} request.body.key - Setting key
 * @param {string} request.body.value - Setting value
 * @example request - Request body example
 *   {
 *     "value": "Updated Site Name"
 *   }
 * @return {object} 200 - Setting updated successfully
 * @example response - 200 - Success response
 *   {
 *     "settingsId": 1,
 *     "key": "site_name",
 *     "value": "Updated Site Name",
 *     "createdAt": "2026-02-06T10:00:00Z",
 *     "updatedAt": "2026-02-06T15:30:00Z"
 *   }
 * @return {object} 400 - Invalid input
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
export const updateSettingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { key, value } = req.body;
    
    const existing = await getSettingById(Number(id));
    if (!existing) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    const updatedSetting = await updateSetting(Number(id), { key, value });
    res.status(200).json(updatedSetting);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
};

/**
 * DELETE /api/settings/{id}
 * @summary Delete a setting
 * @tags Settings
 * @param {integer} id.path.required - Setting ID
 * @return {object} 200 - Setting deleted successfully
 * @example response - 200 - Success response
 *   {
 *     "settingsId": 1,
 *     "deleted": true
 *   }
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
export const deleteSettingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existing = await getSettingById(Number(id));
    if (!existing) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    const deleted = await deleteSetting(Number(id));
    
    if (deleted) {
      res.status(200).json({ settingsId: Number(id), deleted: true }); return;
    } else {
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
};
