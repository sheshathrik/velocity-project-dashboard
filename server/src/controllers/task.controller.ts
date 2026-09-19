import { Response, NextFunction } from 'express';
import { taskService } from '../services/task.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const taskController = {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.query as any;
      const tasks = await taskService.getTasks(filters, req.user!);
      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const taskId = parseInt(req.params.id as string, 10);
      const task = await taskService.getTaskById(taskId, req.user!);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const task = await taskService.createTask(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const taskId = parseInt(req.params.id as string, 10);
      const { status } = req.body;
      const task = await taskService.updateTaskStatus(taskId, status, req.user!);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const taskId = parseInt(req.params.id as string, 10);
      const task = await taskService.updateTask(taskId, req.body, req.user!);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const taskId = parseInt(req.params.id as string, 10);
      const result = await taskService.deleteTask(taskId, req.user!);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
