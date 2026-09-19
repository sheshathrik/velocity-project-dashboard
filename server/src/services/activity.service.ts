import { prisma } from '../config/prisma.js';
import { Role, Prisma } from '@prisma/client';
import { TokenPayload } from '../types/index.js';

export const activityService = {
  async getRecentActivities(user: TokenPayload, projectId?: string, limit = 20) {
    const where: Prisma.TaskActivityLogWhereInput = {};

    // 1. Role-based filtering of activity logs
    if (user.role === Role.ADMIN) {
      // Admin sees activity across all projects in a single global feed
      if (projectId) {
        where.projectId = projectId;
      }
    } else if (user.role === Role.PROJECT_MANAGER) {
      // PM sees activity only from their own projects
      if (projectId) {
        // Verify ownership
        const proj = await prisma.project.findUnique({
          where: { id: projectId },
          select: { managerId: true },
        });
        if (proj && proj.managerId === user.userId) {
          where.projectId = projectId;
        } else {
          where.projectId = 'unauthorized'; // Will yield empty
        }
      } else {
        where.project = { managerId: user.userId };
      }
    } else if (user.role === Role.DEVELOPER) {
      // Developer sees activity only on tasks assigned to them
      where.task = { assignedDeveloperId: user.userId };
      if (projectId) {
        where.projectId = projectId;
      }
    }

    // Fetched directly from the database, not cached in memory
    return prisma.taskActivityLog.findMany({
      where,
      take: Math.min(limit, 50),
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        task: {
          select: { id: true, title: true, status: true, priority: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
