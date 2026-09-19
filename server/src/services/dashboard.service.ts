import { prisma } from '../config/prisma.js';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';
import { TokenPayload } from '../types/index.js';
import { getOnlineUserCount } from '../sockets/socketServer.js';

export const dashboardService = {
  async getDashboardMetrics(user: TokenPayload) {
    const now = new Date();

    if (user.role === Role.ADMIN) {
      // Admin Dashboard
      const [totalProjects, tasks, overdueCount] = await Promise.all([
        prisma.project.count(),
        prisma.task.findMany({
          select: { status: true },
        }),
        prisma.task.count({
          where: {
            OR: [
              { isOverdue: true },
              { dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
            ],
          },
        }),
      ]);

      // Group tasks by status
      const tasksByStatus: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.IN_REVIEW]: 0,
        [TaskStatus.DONE]: 0,
      };

      tasks.forEach((t) => {
        tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
      });

      const activeUsersOnline = getOnlineUserCount();

      return {
        role: Role.ADMIN,
        metrics: {
          totalProjects,
          totalTasks: tasks.length,
          tasksByStatus,
          overdueTaskCount: overdueCount,
          activeUsersOnline,
        },
      };
    }

    if (user.role === Role.PROJECT_MANAGER) {
      // PM Dashboard: their projects summary, tasks by priority, upcoming due dates this week
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);

      const [projects, tasks, upcomingTasks] = await Promise.all([
        prisma.project.findMany({
          where: { managerId: user.userId },
          include: {
            client: true,
            _count: { select: { tasks: true } },
          },
        }),
        prisma.task.findMany({
          where: { project: { managerId: user.userId } },
          select: { priority: true, status: true, isOverdue: true },
        }),
        prisma.task.findMany({
          where: {
            project: { managerId: user.userId },
            status: { not: TaskStatus.DONE },
            dueDate: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
          include: {
            project: { select: { name: true } },
            assignedDeveloper: { select: { name: true } },
          },
          orderBy: { dueDate: 'asc' },
        }),
      ]);

      const tasksByPriority: Record<TaskPriority, number> = {
        [TaskPriority.LOW]: 0,
        [TaskPriority.MEDIUM]: 0,
        [TaskPriority.HIGH]: 0,
        [TaskPriority.CRITICAL]: 0,
      };

      tasks.forEach((t) => {
        tasksByPriority[t.priority] = (tasksByPriority[t.priority] || 0) + 1;
      });

      return {
        role: Role.PROJECT_MANAGER,
        metrics: {
          totalProjects: projects.length,
          totalTasks: tasks.length,
          tasksByPriority,
          upcomingDueThisWeekCount: upcomingTasks.length,
          upcomingTasksThisWeek: upcomingTasks,
          projectsSummary: projects,
        },
      };
    }

    // Developer Dashboard: their assigned tasks, sorted by priority then due date
    const priorityOrder = {
      [TaskPriority.CRITICAL]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1,
    };

    const assignedTasks = await prisma.task.findMany({
      where: { assignedDeveloperId: user.userId },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    const pendingTasks = assignedTasks.filter((t) => t.status !== TaskStatus.DONE);
    const completedTasks = assignedTasks.filter((t) => t.status === TaskStatus.DONE);
    const overdueTasks = assignedTasks.filter(
      (t) => t.status !== TaskStatus.DONE && (t.isOverdue || t.dueDate < now)
    );

    return {
      role: Role.DEVELOPER,
      metrics: {
        totalAssigned: assignedTasks.length,
        pendingCount: pendingTasks.length,
        completedCount: completedTasks.length,
        overdueCount: overdueTasks.length,
        assignedTasks,
      },
    };
  },
};

