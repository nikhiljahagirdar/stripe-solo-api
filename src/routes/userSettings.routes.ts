import { Router } from 'express';
import {
  getUserSettingsController,
  getUserSettingsWithDetailsController,
  getUserSettingByIdController,
  createUserSettingController,
  updateUserSettingController,
  upsertUserSettingController,
  deleteUserSettingController,
  deleteAllUserSettingsController,
} from '../controllers/userSettings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/user-settings
 * @summary Get all user settings for authenticated user
 * @tags User Settings
 * @security bearerAuth
 * @return {array<object>} 200 - List of user settings
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal server error
 */
router.get('/', authenticate, getUserSettingsController);

/**
 * GET /api/user-settings/detailed
 * @summary Get all user settings with setting details for authenticated user
 * @tags User Settings
 * @security bearerAuth
 * @return {array<object>} 200 - List of user settings with details
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal server error
 */
router.get('/detailed', authenticate, getUserSettingsWithDetailsController);

/**
 * POST /api/user-settings/upsert
 * @summary Create or update a user setting
 * @tags User Settings
 * @security bearerAuth
 * @param {object} request.body.required - User setting data
 * @return {object} 200 - User setting created or updated successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
router.post('/upsert', authenticate, upsertUserSettingController);

/**
 * GET /api/user-settings/{id}
 * @summary Get a user setting by ID
 * @tags User Settings
 * @security bearerAuth
 * @param {integer} id.path.required - User setting ID
 * @return {object} 200 - User setting found
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - User setting not found
 * @return {object} 500 - Internal server error
 */
router.get('/:id', authenticate, getUserSettingByIdController);

/**
 * POST /api/user-settings
 * @summary Create a new user setting
 * @tags User Settings
 * @security bearerAuth
 * @param {object} request.body.required - User setting data
 * @return {object} 201 - User setting created successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
router.post('/', authenticate, createUserSettingController);

/**
 * PUT /api/user-settings/{id}
 * @summary Update a user setting
 * @tags User Settings
 * @security bearerAuth
 * @param {integer} id.path.required - User setting ID
 * @param {object} request.body.required - User setting data
 * @return {object} 200 - User setting updated successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - User setting not found
 * @return {object} 500 - Internal server error
 */
router.put('/:id', authenticate, updateUserSettingController);

/**
 * DELETE /api/user-settings/{id}
 * @summary Delete a user setting
 * @tags User Settings
 * @security bearerAuth
 * @param {integer} id.path.required - User setting ID
 * @return {object} 200 - User setting deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - User setting not found
 * @return {object} 500 - Internal server error
 */
router.delete('/:id', authenticate, deleteUserSettingController);

/**
 * DELETE /api/user-settings
 * @summary Delete all user settings for authenticated user
 * @tags User Settings
 * @security bearerAuth
 * @return {object} 200 - User settings deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal server error
 */
router.delete('/', authenticate, deleteAllUserSettingsController);

export default router;
