import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, roles } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env['JWT_SECRET'];

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}

interface UserPayload {
  id: number;
  email: string;
  role: string;
  roleId: number;
}

/**
 * @function getDecodedToken
 * @description Decodes the JWT from the request headers.
 * @param {Request} req - The Express request object.
 * @returns {UserPayload | null} The user data object from the token or null if the token is invalid or not provided.
 */
export const getDecodedToken = (req: Request): UserPayload | null => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserPayload;
    return payload;
  } catch (err) {
    return null;
  }
};

/**
 * @function getUserFromToken
 * @description Decodes the JWT from the request headers and retrieves the full user object from the database.
 * @param {Request} req - The Express request object.
 * @returns {Promise<UserPayload | null>} The user data object or null if the token is invalid or not provided.
 */
export const getUserFromToken = async (req: Request): Promise<UserPayload | null> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      role: roles.name,
      roleId: users.roleId
    }).from(users).innerJoin(roles, eq(users.roleId, roles.id)).where(eq(users.id, payload.id)).limit(1);

    return userResult.length > 0 ? userResult[0] ?? null : null;
  } catch (err) {
    return null;
  }
};