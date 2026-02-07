import { Router } from 'express';
import { listFiles, uploadFile } from '../controllers/file.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/files
 * @summary List files
 * @tags Files
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter files.
 * @param {integer} [year] year.query - A year to filter files by creation date.
 */
router.get('/', listFiles);

/**
 * POST /api/v1/files
 * @summary Upload file
 * @tags Files
 * @security BearerAuth
 */
router.post('/', uploadFile);

export default router;