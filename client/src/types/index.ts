export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActivityType =
  | 'STATUS_CHANGE'
  | 'TASK_ASSIGNED'
  | 'TASK_CREATED'
  | 'TASK_OVERDUE'
  | 'TASK_UPDATED';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_IN_REVIEW'
  | 'TASK_OVERDUE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  client?: Client;
  managerId: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  projectId: string;
  project?: {
    id: string;
    name: string;
    managerId?: string;
  };
  assignedDeveloperId?: string | null;
  assignedDeveloper?: {
    id: string;
    name: string;
    email: string;
  } | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivityLog {
  id: string;
  taskId: number;
  projectId: string;
  userId: string;
  type: ActivityType;
  message: string;
  details: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  task?: {
    id: number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  taskId?: number | null;
  task?: {
    id: number;
    title: string;
    projectId: string;
  } | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminMetrics {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  overdueTaskCount: number;
  activeUsersOnline: number;
}

export interface PMMetrics {
  totalProjects: number;
  totalTasks: number;
  tasksByPriority: Record<TaskPriority, number>;
  upcomingDueThisWeekCount: number;
  upcomingTasksThisWeek: Task[];
  projectsSummary: Project[];
}

export interface DeveloperMetrics {
  totalAssigned: number;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
  assignedTasks: Task[];
}
