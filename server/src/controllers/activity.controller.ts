import { Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const activityController = {
  async getRecent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, limit } = req.query as { projectId?: string; limit?: string };
      const parsedLimit = limit ? parseInt(limit, 10) : 20;

      const activities = await activityService.getRecentActivities(
        req.user!,
        projectId,
        parsedLimit
      );

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (err) {
      next(err);
    }
  },
};
