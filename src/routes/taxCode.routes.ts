import { Router } from 'express';
import { getTaxCodes, getTaxCode, syncTaxCode } from '../controllers/taxCode.controller';
import { authenticate } from '../middleware/authenticate';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

router.get('/', authenticate, checkRole(['admin', 'member']), getTaxCodes);
router.get('/:id', authenticate, checkRole(['admin', 'member']), getTaxCode);
router.post('/sync', authenticate, checkRole(['admin', 'member']), syncTaxCode);

export default router;