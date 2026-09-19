import { z } from 'zod';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100),
  description: z.string().max(1000).optional(),
  clientId: z.string().uuid('Valid client ID is required'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  clientId: z.string().uuid().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid('Valid project ID is required'),
  assignedDeveloperId: z.string().uuid('Valid developer ID is required').optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date format for dueDate',
  }),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  assignedDeveloperId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date format for dueDate',
  }).optional(),
});

export const taskQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedDeveloperId: z.string().uuid().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  isOverdue: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const activityQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

