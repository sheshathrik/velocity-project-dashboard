import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';
import { TokenPayload, Role } from '../types/index.js';
import { Response } from 'express';

export const REFRESH_COOKIE_NAME = 'velocity_refresh_token';

export const authService = {
  getCookieOptions() {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/api/auth',
      maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    };
  },

  generateAccessToken(user: { id: string; email: string; role: Role; name: string }): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });
  },

  async createRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError('Missing refresh token cookie', 401, 'MISSING_REFRESH_TOKEN');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new AppError('Refresh token invalid or expired. Please sign in again.', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Token rotation: Revoke the used refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Issue new pair
    const newAccessToken = this.generateAccessToken(storedToken.user);
    const newRefreshToken = await this.createRefreshToken(storedToken.user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        role: storedToken.user.role,
      },
    };
  },

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  },
};
