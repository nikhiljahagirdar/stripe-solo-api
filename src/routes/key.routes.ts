import { Router } from 'express';
import { createKey, getKeys, updateKey, deleteKey, checkHasKeys} from '../controllers/key.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /keys
 * @summary Create a new Stripe API key
 * @tags Keys
 * @param {object} request.body.required - API key data
 * @param {string} request.body.name.required - Friendly name for the API key
 * @param {string} request.body.apiKey.required - Stripe API key (already encrypted from UI)
 * @example request - Request body example
 *   {
 *     "name": "Production Key",
 *     "apiKey": "sk_live_123456789"
 *   }
 * @return {object} 201 - API key created successfully
 * @example response - 201 - Success response
 *   {
 *     "id": 1,
 *     "userId": 1,
 *     "name": "Production Key",
 *     "createdAt": "2023-10-26T10:30:00Z"
 *   }
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 */
router.post('/', authenticate, createKey);

/**
 * GET /keys
 * @summary Get all Stripe API keys for the authenticated user
 * @tags Keys
 * @param {integer} [accountId] accountId.query - An account ID to filter Stripe keys by.
 * @param {integer} [year] year.query - A year to filter Stripe keys by creation date.
 * @return {array<object>} 200 - List of API keys
 * @example response - 200 - Success response
 *   [{
 *     "id": 1,
 *     "userId": 1,
 *     "name": "Production Key",
 *     "createdAt": "2023-10-26T10:30:00Z"
 *   }]
 * @return {object} 401 - Unauthorized
 */
router.get('/', authenticate, getKeys);

/**
 * PUT /keys/{id}
 * @summary Update a Stripe API key name
 * @tags Keys
 * @param {integer} id.path.required - API key ID
 * @param {object} request.body.required - Update data
 * @param {string} request.body.name.required - New name for the API key
 * @example request - Request body example
 *   {
 *     "name": "Updated Production Key"
 *   }
 * @return {object} 200 - API key updated successfully
 * @return {object} 400 - Invalid input
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - API key not found
 */
router.put('/:id', authenticate, updateKey);

/**
 * DELETE /keys/{id}
 * @summary Delete a Stripe API key
 * @tags Keys
 * @param {integer} id.path.required - API key ID
 * @return {object} 200 - API key deleted successfully
 * @example response - 200 - Success response
 *   {
 *     "id": 1,
 *     "deleted": true
 *   }
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - API key not found
 */
router.delete('/:id', authenticate, deleteKey);


router.get('/has-keys', authenticate, checkHasKeys); 

export default router;
