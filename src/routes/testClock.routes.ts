import { Router } from 'express';
import { createTestClock, getTestClocks, getTestClock, advanceTestClock } from '../controllers/testClock.controller';
import { authenticate } from '../middleware/authenticate';
import { checkRole } from '../middleware/role.middleware';

const router = Router();

router.post('/', authenticate, checkRole(['admin', 'member']), createTestClock);
router.get('/', authenticate, checkRole(['admin', 'member']), getTestClocks);
router.get('/:id', authenticate, checkRole(['admin', 'member']), getTestClock);
router.post('/:id/advance', authenticate, checkRole(['admin', 'member']), advanceTestClock);

export default router;