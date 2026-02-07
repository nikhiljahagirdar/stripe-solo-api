import type { Application, Request, Response } from 'express';
import express from 'express';
import { getLayoutFor } from '../services/layout.service';
import { getRecentNotifications } from '../services/notification.service';

/**
 * Register UI-related routes:
 * - GET /api/ui/layout?path=/current/path
 * - GET /api/ui/notifications
 *
 * Assumes authentication middleware attaches user to req.user.
 */
export default function registerUiRoutes(app: Application) {
  const router = express.Router();

  router.get('/layout', (req: Request, res: Response) => {
    const path = String(req.query['path'] ?? '');
    const user = req.user; // auth middleware should attach user
    res.json(getLayoutFor({ user, path }));
  });

  router.get('/notifications', async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      res.status(401).json([]);
      return;
    }
    const list = await getRecentNotifications(user.id, 5);
    res.json(list);
  });

  app.use('/api/ui', router);
}
