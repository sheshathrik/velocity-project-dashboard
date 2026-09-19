import { Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const notificationController = {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user!.userId);
      const unreadCount = await notificationService.getUnreadCount(req.user!.userId);
      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await notificationService.markAsRead(req.params.id as string, req.user!.userId);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllAsRead(req.user!.userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
