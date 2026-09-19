import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';

export const userController = {
  // Get all developers for task assignment dropdown
  async getDevelopers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const developers = await prisma.user.findMany({
        where: { role: Role.DEVELOPER },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({
        success: true,
        data: developers,
      });
    } catch (err) {
      next(err);
    }
  },

  // Get all clients (for project creation)
  async getClients(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clients = await prisma.client.findMany({
        orderBy: { name: 'asc' },
      });
      res.status(200).json({
        success: true,
        data: clients,
      });
    } catch (err) {
      next(err);
    }
  },

  // Admin view all users
  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  },
};

