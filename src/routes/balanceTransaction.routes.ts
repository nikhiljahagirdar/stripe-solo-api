import { Router } from 'express';
import { getBalanceTransactions, getBalanceTransaction, syncBalanceTransaction } from '../controllers/balanceTransaction.controller';

const router = Router();

router.get('/',  getBalanceTransactions);
router.get('/:id', getBalanceTransaction);
router.post('/sync' , syncBalanceTransaction);

export default router;