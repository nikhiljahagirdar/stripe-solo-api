import { Router } from 'express';
import { createFileLink, getFileLinks, getFileLink } from '../controllers/fileLink.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/', authenticate, createFileLink);
router.get('/', authenticate, getFileLinks);
router.get('/:id', authenticate, getFileLink);

export default router;