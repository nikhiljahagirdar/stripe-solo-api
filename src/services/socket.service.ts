import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import { config } from '../config';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin || '*',
      credentials: true,
    },
    path: '/socket.io/',
  });

  // Authentication middleware
  io.use((socket: any, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: number };
      socket.userId = decoded.userId;
      logger.info(`Socket authenticated for user ${decoded.userId}`);
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: any) => {
    const userId = socket.userId;
    logger.info(`User ${userId} connected via WebSocket`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected from WebSocket`);
    });

    // Send welcome message
    socket.emit('connected', { 
      message: 'Connected to notification service',
      userId 
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
export const getSocketIO = (): SocketIOServer | null => {
  return io;
};

/**
 * Emit notification to specific user
 */
export const emitNotificationToUser = (userId: number, notification: {
  type: 'sync_success' | 'sync_failure' | 'sync_partial';
  message: string;
  keyName?: string;
  accountsCount?: number;
  timestamp?: string;
}): void => {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit notification');
    return;
  }

  const payload = {
    ...notification,
    timestamp: notification.timestamp || new Date().toISOString(),
  };

  io.to(`user:${userId}`).emit('notification', payload);
  logger.info(`Notification emitted to user ${userId}:`, payload);
};

/**
 * Emit account sync status to user
 */
export const emitSyncStatus = (userId: number, status: {
  event: 'sync_started' | 'sync_progress' | 'sync_completed' | 'sync_failed';
  keyName: string;
  progress?: number;
  message?: string;
}): void => {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit sync status');
    return;
  }

  io.to(`user:${userId}`).emit('sync_status', status);
  logger.info(`Sync status emitted to user ${userId}:`, status);
};

/**
 * Broadcast to all connected users (admin only)
 */
export const broadcastNotification = (notification: {
  type: string;
  message: string;
}): void => {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot broadcast');
    return;
  }

  io.emit('broadcast', notification);
  logger.info('Broadcast notification sent:', notification);
};
