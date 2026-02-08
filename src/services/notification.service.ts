import { db } from '../db';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { notificationsTable, type NewNotification } from '../db/schema';

export interface Notification {
  id: number;
  userId: number;
  type: 'sync_success' | 'sync_failure' | 'sync_partial';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

type NotificationType = Notification['type'];

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
 */
export const getRecentNotifications = async (userId: number, limit = 5): Promise<Notification[]> => {
  const result = await listNotifications(userId, { page: 1, pageSize: limit });
  return result.notifications;
};

export const listNotifications = async (
  userId: number,
  options?: { unreadOnly?: boolean; page?: number; pageSize?: number },
): Promise<{ notifications: Notification[]; totalCount: number }> => {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const unreadOnly = options?.unreadOnly ?? false;
  const offset = (page - 1) * pageSize;
  const conditions = [eq(notificationsTable.userId, userId)];

  if (unreadOnly) {
    conditions.push(eq(notificationsTable.isRead, false));
  }

  const whereClause = and(...conditions);

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: notificationsTable.id,
        userId: notificationsTable.userId,
        type: sql<NotificationType>`${notificationsTable.type}`,
        message: notificationsTable.message,
        isRead: sql<boolean>`coalesce(${notificationsTable.isRead}, false)`,
        createdAt: notificationsTable.createdAt,
      })
      .from(notificationsTable)
      .where(whereClause)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(notificationsTable)
      .where(whereClause),
  ]);

  return {
    notifications: data,
    totalCount: totalResult[0]?.count ?? 0,
  };
};

export const getNotificationById = async (
  userId: number,
  notificationId: number,
): Promise<Notification | null> => {
  const [row] = await db
    .select({
      id: notificationsTable.id,
      userId: notificationsTable.userId,
      type: sql<NotificationType>`${notificationsTable.type}`,
      message: notificationsTable.message,
      isRead: sql<boolean>`coalesce(${notificationsTable.isRead}, false)`,
      createdAt: notificationsTable.createdAt,
    })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.id, notificationId)))
    .limit(1);

  return row ?? null;
};

export const setNotificationReadState = async (
  userId: number,
  notificationId: number,
  isRead: boolean,
): Promise<Notification | null> => {
  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.id, notificationId)))
    .returning({
      id: notificationsTable.id,
      userId: notificationsTable.userId,
      type: sql<NotificationType>`${notificationsTable.type}`,
      message: notificationsTable.message,
      isRead: sql<boolean>`coalesce(${notificationsTable.isRead}, false)`,
      createdAt: notificationsTable.createdAt,
    });

  return updated ?? null;
};