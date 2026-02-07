import type { Request } from 'express';
import { getUserFromToken } from './auth.utils';
import { getUserById } from '../services/user.service';

export async function getEffectiveUserId(req: Request): Promise<number | null> {
  const user = await getUserFromToken(req);
  if (!user?.id) {
    return null;
  }

  const dbUser = await getUserById(user.id);
  if (!dbUser) {
    return user.id;
  }
  return (dbUser.parentId !== null && dbUser.parentId > 0) ? dbUser.parentId : user.id;
}