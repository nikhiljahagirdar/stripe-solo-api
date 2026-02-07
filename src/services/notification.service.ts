import { db } from '../db';
import { eq, desc } from 'drizzle-orm';
import { notificationsTable, type NewNotification } from '../db/schema';

export interface Notification {
  id: number;
  title: string;
  body?: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Creates a notification for a user
 */
export const createNotification = async (notification: {
  userId: number;
  type: 'sync_success' | 'sync_failure' | 'sync_partial';
  message: string;
}): Promise<void> => {
  const newNotification: NewNotification = {
    userId: notification.userId,
    type: notification.type,
    message: notification.message,
    isRead: false,
  };
  
  await db.insert(notificationsTable).values(newNotification);
};

/**
 * Returns the most recent notifications for a user (limit default 5).
 * If a notifications table/schema is not present, returns empty array (safe fallback).
 */
export const getRecentNotifications = async (userId: number, limit = 5): Promise<Notification[]> => {
  // Try to locate notifications table in schema; if not present return empty array.
  let notificationsTable: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const schema = require('../db/schema');
    notificationsTable = schema.notificationsTable;
  } catch {
    notificationsTable = undefined;
  }

  if (!notificationsTable) {
    return []; // no notifications table defined yet
  }

  const rows = await db
    .select({
      id: notificationsTable.id,
      title: notificationsTable.title,
      body: notificationsTable.body,
      read: notificationsTable.read,
      createdAt: notificationsTable.createdAt,
    })
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);

  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    read: !!r.read,
    createdAt: r.createdAt,
  }));
};