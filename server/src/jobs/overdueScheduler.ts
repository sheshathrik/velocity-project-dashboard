import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { ActivityType, NotificationType, TaskStatus } from '@prisma/client';
import { socketEmitter } from '../sockets/socketEmitter.js';

let cronTask: cron.ScheduledTask | null = null;

export async function runOverdueCheckOnce(): Promise<number> {
  const now = new Date();

  // Find all tasks past their due date that are NOT Done and have NOT yet been flagged overdue
  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: TaskStatus.DONE },
      isOverdue: false,
    },
    include: {
      project: {
        include: {
          manager: true,
        },
      },
      assignedDeveloper: true,
    },
  });

  if (overdueTasks.length === 0) {
    return 0;
  }

  console.log(`⏰ [OverdueScheduler] Found ${overdueTasks.length} newly overdue task(s). Processing...`);

  // System user id for logs — fallback to admin or project manager
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  for (const task of overdueTasks) {
    try {
      const fallbackUserId = adminUser ? adminUser.id : task.project.managerId;

      // Update task in database
      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: { isOverdue: true },
      });

      // Create activity log
      const logMessage = `System Scheduler flagged Task #${task.id} ("${task.title}") as Overdue`;
      const activityLog = await prisma.taskActivityLog.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: fallbackUserId,
          type: ActivityType.TASK_OVERDUE,
          message: logMessage,
          details: {
            taskTitle: task.title,
            dueDate: task.dueDate,
            flaggedAt: now,
            reason: 'Background scheduler detected elapsed due date',
          },
        },
      });

      const notificationsToCreate = [];

      // Notify assigned developer
      if (task.assignedDeveloperId) {
        notificationsToCreate.push({
          userId: task.assignedDeveloperId,
          taskId: task.id,
          type: NotificationType.TASK_OVERDUE,
          title: 'Task Overdue Warning',
          message: `Task #${task.id} ("${task.title}") is past its due date!`,
          isRead: false,
        });
      }

      // Notify project manager
      notificationsToCreate.push({
        userId: task.project.managerId,
        taskId: task.id,
        type: NotificationType.TASK_OVERDUE,
        title: 'Project Task Overdue',
        message: `Task #${task.id} ("${task.title}") in "${task.project.name}" is overdue.`,
        isRead: false,
      });

      const createdNotifications = [];
      for (const notifData of notificationsToCreate) {
        const created = await prisma.notification.create({ data: notifData });
        createdNotifications.push(created);
      }

      // Emit real-time WebSocket events
      socketEmitter.emitTaskOverdue({
        task: updatedTask,
        project: task.project,
        activityLog,
        notifications: createdNotifications,
      });
    } catch (err) {
      console.error(`Error processing overdue task #${task.id}:`, err);
    }
  }

  return overdueTasks.length;
}

export function startOverdueScheduler(): cron.ScheduledTask {
  // Run once immediately on startup
  runOverdueCheckOnce().catch((err) =>
    console.error('Initial overdue check failed:', err)
  );

  // Schedule to run every minute
  cronTask = cron.schedule('* * * * *', async () => {
    try {
      await runOverdueCheckOnce();
    } catch (err) {
      console.error('Error running scheduled overdue check:', err);
    }
  });

  console.log('⏱️ [Scheduler] Overdue Task Background Job initialized (Interval: Every minute).');
  return cronTask;
}
