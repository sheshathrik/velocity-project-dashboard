import { Request, Response, NextFunction } from 'express';
import { authService, REFRESH_COOKIE_NAME } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Set Refresh Token in HttpOnly cookie — not in localStorage
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, authService.getCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const result = await authService.refresh(refreshToken);

      // Rotate Refresh Token in HttpOnly cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, authService.getCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      await authService.logout(refreshToken);

      // Clear the cookie
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/auth',
      });

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
};
