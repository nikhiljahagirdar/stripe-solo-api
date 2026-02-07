import { Router } from 'express';
import { listBankAccounts, createBankAccount } from '../controllers/bankAccount.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/bank-accounts
 * @summary List bank accounts
 * @tags Bank Accounts
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter bank accounts.
 * @param {integer} [year] year.query - A year to filter bank accounts by creation date.
 */
router.get('/', listBankAccounts);

/**
 * POST /api/v1/bank-accounts
 * @summary Create bank account
 * @tags Bank Accounts
 * @security BearerAuth
 */
router.post('/', createBankAccount);

export default router;