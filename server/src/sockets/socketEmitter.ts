import { getIO } from './socketServer.js';
import { Task, Project, TaskActivityLog, Notification } from '@prisma/client';

export const socketEmitter = {
  // Emit task status change
  emitTaskStatusUpdated(params: {
    task: Task;
    project: Project;
    activityLog: TaskActivityLog;
    notification?: Notification | null;
  }) {
    try {
      const io = getIO();
      const { task, project, activityLog, notification } = params;

      // 1. Broadcast task update to project room
      io.to(`project:${project.id}`).emit('task:status_updated', {
        taskId: task.id,
        projectId: project.id,
        newStatus: task.status,
        task,
      });

      // 2. Broadcast activity log according to role permissions
      // Admin sees all activity in global feed
      io.to('role:ADMIN').emit('activity:new', activityLog);

      // PM sees activity for their projects
      io.to(`user:${project.managerId}`).emit('activity:new', activityLog);

      // Developer sees activity only if assigned to this task
      if (task.assignedDeveloperId) {
        io.to(`user:${task.assignedDeveloperId}`).emit('activity:new', activityLog);
      }

      // Also send to the project room for users currently viewing this project
      io.to(`project:${project.id}`).emit('activity:new', activityLog);

      // 3. Send in-app notification if created (e.g. PM notified for In Review)
      if (notification) {
        io.to(`user:${notification.userId}`).emit('notification:new', notification);
      }
    } catch (err) {
      console.error('Failed to emit task status update via socket:', err);
    }
  },

  // Emit task assigned event
  emitTaskAssigned(params: {
    task: Task;
    project: Project;
    activityLog: TaskActivityLog;
    notification?: Notification | null;
  }) {
    try {
      const io = getIO();
      const { task, project, activityLog, notification } = params;

      // Broadcast task update
      io.to(`project:${project.id}`).emit('task:assigned', {
        taskId: task.id,
        projectId: project.id,
        task,
      });

      // Broadcast activity log
      io.to('role:ADMIN').emit('activity:new', activityLog);
      io.to(`user:${project.managerId}`).emit('activity:new', activityLog);

      if (task.assignedDeveloperId) {
        io.to(`user:${task.assignedDeveloperId}`).emit('activity:new', activityLog);
      }

      io.to(`project:${project.id}`).emit('activity:new', activityLog);

      // Direct notification to assigned developer
      if (notification && task.assignedDeveloperId) {
        io.to(`user:${task.assignedDeveloperId}`).emit('notification:new', notification);
      }
    } catch (err) {
      console.error('Failed to emit task assigned event via socket:', err);
    }
  },

  // Emit task created event
  emitTaskCreated(params: {
    task: Task;
    project: Project;
    activityLog: TaskActivityLog;
    notification?: Notification | null;
  }) {
    try {
      const io = getIO();
      const { task, project, activityLog, notification } = params;

      io.to(`project:${project.id}`).emit('task:created', { task });
      io.to('role:ADMIN').emit('activity:new', activityLog);
      io.to(`user:${project.managerId}`).emit('activity:new', activityLog);

      if (task.assignedDeveloperId) {
        io.to(`user:${task.assignedDeveloperId}`).emit('activity:new', activityLog);
        if (notification) {
          io.to(`user:${task.assignedDeveloperId}`).emit('notification:new', notification);
        }
      }
    } catch (err) {
      console.error('Failed to emit task created via socket:', err);
    }
  },

  // Emit task overdue flagged by background scheduler
  emitTaskOverdue(params: {
    task: Task;
    project: Project;
    activityLog: TaskActivityLog;
    notifications: Notification[];
  }) {
    try {
      const io = getIO();
      const { task, project, activityLog, notifications } = params;

      io.to(`project:${project.id}`).emit('task:overdue', { task });
      io.to('role:ADMIN').emit('activity:new', activityLog);
      io.to(`user:${project.managerId}`).emit('activity:new', activityLog);

      if (task.assignedDeveloperId) {
        io.to(`user:${task.assignedDeveloperId}`).emit('activity:new', activityLog);
      }

      notifications.forEach((notif) => {
        io.to(`user:${notif.userId}`).emit('notification:new', notif);
      });
    } catch (err) {
      console.error('Failed to emit overdue task via socket:', err);
    }
  },

  // Emit notification count update or mark read
  emitNotificationRead(userId: string, notificationId: string, unreadCount: number) {
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:read', { notificationId, unreadCount });
    } catch (err) {
      console.error('Failed to emit notification read via socket:', err);
    }
  },
};

