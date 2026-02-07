import { Router } from 'express';
import { getAllCashBalances, getCashBalanceById, syncCashBalance } from '../controllers/cashBalance.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, getAllCashBalances);
router.get('/:id', authenticate, getCashBalanceById);
router.post('/sync', authenticate, syncCashBalance);

export default router;