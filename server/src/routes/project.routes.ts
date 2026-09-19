import { Router } from 'express';
import { projectController } from '../controllers/project.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/schemas.js';
import { Role } from '@prisma/client';

const router = Router();

// All project routes require authentication
router.use(authenticateJWT);

// GET /api/projects - Allowed for all authenticated roles (service filters projects per role)
router.get('/', projectController.getAll);

// GET /api/projects/:id - Fetches specific project with role ownership verification
router.get('/:id', projectController.getById);

// POST /api/projects - Admin and PM can create projects
router.post(
  '/',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest({ body: createProjectSchema }),
  projectController.create
);

// PUT /api/projects/:id - Admin and PM can update projects (ownership checked in service)
router.put(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest({ body: updateProjectSchema }),
  projectController.update
);

// DELETE /api/projects/:id - Admin and PM can delete projects (ownership checked in service)
router.delete(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  projectController.delete
);

export default router;

