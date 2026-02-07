import type { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * @function authenticate
 * @description Middleware to authenticate a user.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);

  if (!user) {
    res.status(401).json({ message: 'Unauthorized: Invalid token or user not found.' });
    return;
  }

  next();
};
