import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { socketEmitter } from '../sockets/socketEmitter.js';

export const notificationService = {
  async getUserNotifications(userId: string, limit = 30) {
    return prisma.notification.findMany({
      where: { userId },
      include: {
        task: {
          select: { id: true, title: true, projectId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.userId !== userId) {
      throw new AppError('Forbidden: Cannot modify another user’s notification', 403, 'FORBIDDEN');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    const unreadCount = await this.getUnreadCount(userId);
    socketEmitter.emitNotificationRead(userId, notificationId, unreadCount);

    return updated;
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    socketEmitter.emitNotificationRead(userId, 'ALL', 0);
    return { message: 'All notifications marked as read' };
  },
};

