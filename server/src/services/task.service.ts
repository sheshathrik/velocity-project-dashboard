import { prisma } from '../config/prisma.js';
import {
  Role,
  TaskStatus,
  TaskPriority,
  ActivityType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';
import { TokenPayload } from '../types/index.js';
import { socketEmitter } from '../sockets/socketEmitter.js';

// Helper to convert internal status enum to readable text
function formatStatusLabel(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return 'To Do';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.IN_REVIEW:
      return 'In Review';
    case TaskStatus.DONE:
      return 'Done';
    default:
      return status;
  }
}

export const taskService = {
  async getTasks(
    filters: {
      projectId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedDeveloperId?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
      isOverdue?: string;
      search?: string;
    },
    user: TokenPayload
  ) {
    const where: Prisma.TaskWhereInput = {};

    // 1. RBAC enforcement
    if (user.role === Role.DEVELOPER) {
      // Developer can strictly only see their assigned tasks
      where.assignedDeveloperId = user.userId;
    } else if (user.role === Role.PROJECT_MANAGER) {
      // PM can strictly only see tasks in projects they manage
      where.project = { managerId: user.userId };
    }
    // Admin has no role restriction; can see all tasks

    // 2. Query filters
    if (filters.projectId) {
      // If PM, verify they own the requested project
      if (user.role === Role.PROJECT_MANAGER) {
        const proj = await prisma.project.findUnique({
          where: { id: filters.projectId },
          select: { managerId: true },
        });
        if (!proj || proj.managerId !== user.userId) {
          throw new AppError('Forbidden: Cannot access tasks from another PM’s project', 403, 'FORBIDDEN');
        }
      }
      where.projectId = filters.projectId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assignedDeveloperId && user.role !== Role.DEVELOPER) {
      where.assignedDeveloperId = filters.assignedDeveloperId;
    }

    if (filters.isOverdue !== undefined) {
      where.isOverdue = filters.isOverdue === 'true';
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = new Date(filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = new Date(filters.dueDateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, managerId: true },
        },
        assignedDeveloper: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  },

  async getTaskById(taskId: number, user: TokenPayload) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: { manager: { select: { id: true, name: true, email: true } } },
        },
        assignedDeveloper: {
          select: { id: true, name: true, email: true },
        },
        activityLogs: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Role check
    if (user.role === Role.DEVELOPER && task.assignedDeveloperId !== user.userId) {
      throw new AppError('Forbidden: Developers can only view their own assigned tasks', 403, 'FORBIDDEN');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.managerId !== user.userId) {
      throw new AppError('Forbidden: You can only view tasks from your managed projects', 403, 'FORBIDDEN');
    }

    return task;
  },

  async createTask(
    data: {
      title: string;
      description?: string;
      projectId: string;
      assignedDeveloperId?: string | null;
      priority?: TaskPriority;
      dueDate: string;
    },
    user: TokenPayload
  ) {
    if (user.role === Role.DEVELOPER) {
      throw new AppError('Forbidden: Developers cannot create tasks', 403, 'FORBIDDEN');
    }

    // Verify project exists and check ownership for PM
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if (user.role === Role.PROJECT_MANAGER && project.managerId !== user.userId) {
      throw new AppError('Forbidden: You can only create tasks in your own projects', 403, 'FORBIDDEN');
    }

    // If developer assigned, verify that user exists and has DEVELOPER role
    let developer = null;
    if (data.assignedDeveloperId) {
      developer = await prisma.user.findFirst({
        where: { id: data.assignedDeveloperId, role: Role.DEVELOPER },
      });
      if (!developer) {
        throw new AppError('Assigned user must be a valid Developer', 400, 'INVALID_DEVELOPER');
      }
    }

    const dueDateParsed = new Date(data.dueDate);
    const isPastDue = dueDateParsed < new Date();

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assignedDeveloperId: data.assignedDeveloperId || null,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: dueDateParsed,
        isOverdue: isPastDue,
      },
      include: {
        project: true,
        assignedDeveloper: true,
      },
    });

    // Create Activity Log
    const message = `${user.name} created Task #${task.id}: "${task.title}"`;
    const activityLog = await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: user.userId,
        type: ActivityType.TASK_CREATED,
        message,
        details: {
          taskTitle: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
        },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // If assigned to a developer, create notification
    let notification = null;
    if (task.assignedDeveloperId) {
      notification = await prisma.notification.create({
        data: {
          userId: task.assignedDeveloperId,
          taskId: task.id,
          type: NotificationType.TASK_ASSIGNED,
          title: 'New Task Assigned',
          message: `${user.name} assigned you Task #${task.id}: "${task.title}"`,
        },
      });
    }

    // Real-time broadcast
    socketEmitter.emitTaskCreated({
      task,
      project,
      activityLog,
      notification,
    });

    return task;
  },

  async updateTaskStatus(taskId: number, newStatus: TaskStatus, user: TokenPayload) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignedDeveloper: true,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Role check:
    // Developer can ONLY update tasks assigned to them
    if (user.role === Role.DEVELOPER && task.assignedDeveloperId !== user.userId) {
      throw new AppError(
        'Forbidden: You are not authorized to update tasks assigned to other developers',
        403,
        'FORBIDDEN'
      );
    }

    // PM can only update tasks in their projects
    if (user.role === Role.PROJECT_MANAGER && task.project.managerId !== user.userId) {
      throw new AppError(
        'Forbidden: You are not authorized to update tasks from another PM’s project',
        403,
        'FORBIDDEN'
      );
    }

    const previousStatus = task.status;
    if (previousStatus === newStatus) {
      return task; // No change
    }

    // Update status in DB
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        // If moved to DONE, clear overdue flag
        ...(newStatus === TaskStatus.DONE ? { isOverdue: false } : {}),
      },
      include: {
        project: true,
        assignedDeveloper: true,
      },
    });

    // Formatted activity log as required: "Ravi moved Task #12 from In Progress → In Review · 2 mins ago"
    const fromLabel = formatStatusLabel(previousStatus);
    const toLabel = formatStatusLabel(newStatus);
    const logMessage = `${user.name} moved Task #${task.id} from ${fromLabel} → ${toLabel}`;

    const activityLog = await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: user.userId,
        type: ActivityType.STATUS_CHANGE,
        message: logMessage,
        details: {
          fromStatus: previousStatus,
          toStatus: newStatus,
          taskTitle: task.title,
        },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Check notification trigger:
    // "When a task they own is moved to In Review, the PM receives a notification"
    let notification = null;
    if (newStatus === TaskStatus.IN_REVIEW) {
      const pmId = task.project.managerId;
      // Do not notify if the PM themselves moved it
      if (pmId !== user.userId) {
        notification = await prisma.notification.create({
          data: {
            userId: pmId,
            taskId: task.id,
            type: NotificationType.TASK_IN_REVIEW,
            title: 'Task In Review',
            message: `${user.name} moved Task #${task.id} ("${task.title}") to In Review.`,
          },
        });
      }
    }

    // Real-time broadcast
    socketEmitter.emitTaskStatusUpdated({
      task: updatedTask,
      project: task.project,
      activityLog,
      notification,
    });

    return updatedTask;
  },

  async updateTask(
    taskId: number,
    data: {
      title?: string;
      description?: string | null;
      assignedDeveloperId?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string;
    },
    user: TokenPayload
  ) {
    if (user.role === Role.DEVELOPER) {
      throw new AppError('Developers may only update task status', 403, 'FORBIDDEN');
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true, assignedDeveloper: true },
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.managerId !== user.userId) {
      throw new AppError('Forbidden: You can only edit tasks from your projects', 403, 'FORBIDDEN');
    }

    const updateData: Prisma.TaskUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dueDate !== undefined) {
      const parsedDue = new Date(data.dueDate);
      updateData.dueDate = parsedDue;
      updateData.isOverdue = parsedDue < new Date() && (data.status || task.status) !== TaskStatus.DONE;
    }

    let assignedDevChanged = false;
    if (data.assignedDeveloperId !== undefined) {
      if (data.assignedDeveloperId === null) {
        updateData.assignedDeveloper = { disconnect: true };
      } else {
        const dev = await prisma.user.findFirst({
          where: { id: data.assignedDeveloperId, role: Role.DEVELOPER },
        });
        if (!dev) throw new AppError('Assigned user must be a Developer', 400, 'INVALID_DEVELOPER');
        updateData.assignedDeveloper = { connect: { id: data.assignedDeveloperId } };
        if (data.assignedDeveloperId !== task.assignedDeveloperId) {
          assignedDevChanged = true;
        }
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { project: true, assignedDeveloper: true },
    });

    // If developer assignment changed, trigger notification & activity
    if (assignedDevChanged && updatedTask.assignedDeveloperId) {
      const devName = updatedTask.assignedDeveloper?.name || 'developer';
      const logMessage = `${user.name} assigned Task #${task.id} to ${devName}`;
      const activityLog = await prisma.taskActivityLog.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: user.userId,
          type: ActivityType.TASK_ASSIGNED,
          message: logMessage,
          details: { assignedTo: devName, taskTitle: task.title },
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      const notification = await prisma.notification.create({
        data: {
          userId: updatedTask.assignedDeveloperId,
          taskId: task.id,
          type: NotificationType.TASK_ASSIGNED,
          title: 'New Task Assigned',
          message: `${user.name} assigned you Task #${task.id}: "${task.title}"`,
        },
      });

      socketEmitter.emitTaskAssigned({
        task: updatedTask,
        project: task.project,
        activityLog,
        notification,
      });
    }

    return updatedTask;
  },

  async deleteTask(taskId: number, user: TokenPayload) {
    if (user.role === Role.DEVELOPER) {
      throw new AppError('Forbidden: Developers cannot delete tasks', 403, 'FORBIDDEN');
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.managerId !== user.userId) {
      throw new AppError('Forbidden: You can only delete tasks from your projects', 403, 'FORBIDDEN');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return { message: 'Task deleted successfully' };
  },
};

