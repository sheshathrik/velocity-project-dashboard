import { Request } from 'express';
import { Role, TaskStatus, TaskPriority, ActivityType, NotificationType } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export { Role, TaskStatus, TaskPriority, ActivityType, NotificationType };
