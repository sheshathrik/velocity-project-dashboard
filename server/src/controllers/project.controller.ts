import { Response, NextFunction } from 'express';
import { projectService } from '../services/project.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const projectController = {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.getProjects(req.user!);
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.getProjectById(req.params.id as string, req.user!);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.createProject(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.updateProject(req.params.id as string, req.body, req.user!);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await projectService.deleteProject(req.params.id as string, req.user!);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
