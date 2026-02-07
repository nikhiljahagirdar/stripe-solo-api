import type { Request, Response, NextFunction } from 'express';
import { getDecodedToken } from '../utils/auth.utils';

/**
 * @function checkRole
 * @description Middleware factory to authorize a user based on their role.
 * @param {string | string[]} requiredRoles - The role(s) required to access the route.
 */
export const checkRole = (requiredRoles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = getDecodedToken(req);

    if (!user) {
      res.status(401).json({ message: 'Unauthorized: Invalid token or user not found.' });
      return;
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(user.role)) {
      res.status(403).json({ message: 'Forbidden: You do not have the required permissions.' });
      return;
    }

    next();
  };
};