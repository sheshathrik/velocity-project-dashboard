import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const dashboardController = {
  async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getDashboardMetrics(req.user!);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  },
};

