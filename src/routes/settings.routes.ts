import { Router } from 'express';
import {
  getSettings,
  getSettingByIdController,
  getSettingByKeyController,
  createSettingController,
  updateSettingController,
  deleteSettingController,
} from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/settings
 * @summary Get all settings
 * @tags Settings
 * @security bearerAuth
 * @return {array<object>} 200 - List of settings
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal server error
 */
router.get('/', authenticate, getSettings);

/**
 * GET /api/settings/key/{key}
 * @summary Get a setting by key
 * @tags Settings
 * @security bearerAuth
 * @param {string} key.path.required - Setting key
 * @return {object} 200 - Setting found
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
router.get('/key/:key', authenticate, getSettingByKeyController);

/**
 * GET /api/settings/{id}
 * @summary Get a setting by ID
 * @tags Settings
 * @security bearerAuth
 * @param {integer} id.path.required - Setting ID
 * @return {object} 200 - Setting found
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
router.get('/:id', authenticate, getSettingByIdController);

/**
 * POST /api/settings
 * @summary Create a new setting
 * @tags Settings
 * @security bearerAuth
 * @param {object} request.body.required - Setting data
 * @return {object} 201 - Setting created successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal server error
 */
router.post('/', authenticate, createSettingController);

/**
 * PUT /api/settings/{id}
 * @summary Update a setting
 * @tags Settings
 * @security bearerAuth
 * @param {integer} id.path.required - Setting ID
 * @param {object} request.body.required - Setting data
 * @return {object} 200 - Setting updated successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
router.put('/:id', authenticate, updateSettingController);

/**
 * DELETE /api/settings/{id}
 * @summary Delete a setting
 * @tags Settings
 * @security bearerAuth
 * @param {integer} id.path.required - Setting ID
 * @return {object} 200 - Setting deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Setting not found
 * @return {object} 500 - Internal server error
 */
router.delete('/:id', authenticate, deleteSettingController);

export default router;
