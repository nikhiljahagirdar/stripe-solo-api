import { Router } from 'express';
import { register, login, getUserPermissions } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/permissions', authenticate, getUserPermissions);
export default router;
