import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';
import { TokenPayload } from '../types/index.js';

export const projectService = {
  async getProjects(user: TokenPayload) {
    if (user.role === Role.ADMIN) {
      return prisma.project.findMany({
        include: {
          client: true,
          manager: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.PROJECT_MANAGER) {
      return prisma.project.findMany({
        where: { managerId: user.userId },
        include: {
          client: true,
          manager: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Developers cannot see projects directly, or only projects where they have assigned tasks
    return prisma.project.findMany({
      where: {
        tasks: {
          some: { assignedDeveloperId: user.userId },
        },
      },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getProjectById(projectId: string, user: TokenPayload) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          // If developer, only return tasks assigned to this developer!
          where: user.role === Role.DEVELOPER ? { assignedDeveloperId: user.userId } : undefined,
          include: {
            assignedDeveloper: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Role ownership check: PM can only view their own projects
    if (user.role === Role.PROJECT_MANAGER && project.managerId !== user.userId) {
      throw new AppError(
        'Forbidden: You are not authorized to view or manage another PM’s project',
        403,
        'FORBIDDEN'
      );
    }

    // Developer can only view if they have assigned tasks in it
    if (user.role === Role.DEVELOPER) {
      const hasTask = project.tasks.length > 0;
      if (!hasTask) {
        throw new AppError(
          'Forbidden: You do not have any assigned tasks in this project',
          403,
          'FORBIDDEN'
        );
      }
    }

    return project;
  },

  async createProject(data: { name: string; description?: string; clientId: string }, user: TokenPayload) {
    // Only Admin and PM can create projects
    if (user.role === Role.DEVELOPER) {
      throw new AppError('Developers are not permitted to create projects', 403, 'FORBIDDEN');
    }

    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new AppError('Specified Client does not exist', 404, 'CLIENT_NOT_FOUND');
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        managerId: user.userId, // PM or Admin creator becomes the manager
      },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async updateProject(
    projectId: string,
    data: { name?: string; description?: string; clientId?: string },
    user: TokenPayload
  ) {
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.managerId !== user.userId) {
      throw new AppError(
        'Forbidden: You can only edit projects that you created',
        403,
        'FORBIDDEN'
      );
    }

    if (user.role === Role.DEVELOPER) {
      throw new AppError('Forbidden: Developers cannot edit projects', 403, 'FORBIDDEN');
    }

    return prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async deleteProject(projectId: string, user: TokenPayload) {
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.managerId !== user.userId) {
      throw new AppError('Forbidden: You can only delete projects you created', 403, 'FORBIDDEN');
    }

    if (user.role === Role.DEVELOPER) {
      throw new AppError('Forbidden: Developers cannot delete projects', 403, 'FORBIDDEN');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Project deleted successfully' };
  },
};

