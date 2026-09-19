import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '../validators/schemas.js';
import { Role } from '@prisma/client';

const router = Router();

// All task routes require authentication
router.use(authenticateJWT);

// GET /api/tasks - Retrieve tasks with filtering (query validated, role-scoped in service)
router.get('/', validateRequest({ query: taskQuerySchema }), taskController.getAll);

// GET /api/tasks/:id - Retrieve single task (role ownership checked in service)
router.get('/:id', taskController.getById);

// POST /api/tasks - Only Admin and PM can create tasks
router.post(
  '/',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest({ body: createTaskSchema }),
  taskController.create
);

// PATCH /api/tasks/:id/status - Developers, PMs, Admins can update status (checked in service)
router.patch(
  '/:id/status',
  validateRequest({ body: updateTaskStatusSchema }),
  taskController.updateStatus
);

// PUT /api/tasks/:id - Admin and PM can edit full task details (assignee, due date, priority)
router.put(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest({ body: updateTaskSchema }),
  taskController.update
);

// DELETE /api/tasks/:id - Admin and PM can delete tasks
router.delete(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  taskController.delete
);

export default router;
