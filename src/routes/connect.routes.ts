import { Router } from 'express';
import { listConnectAccounts, createConnectAccount } from '../controllers/connect.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/connect/accounts
 * @summary List connect accounts
 * @tags Connect
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter connect accounts.
 * @param {integer} [year] year.query - A year to filter connect accounts by creation date.
 */
router.get('/accounts', listConnectAccounts);

/**
 * POST /api/v1/connect/accounts
 * @summary Create connect account
 * @tags Connect
 * @security BearerAuth
 */
router.post('/accounts', createConnectAccount);

export default router;