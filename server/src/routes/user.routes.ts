import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Available developers for task assignment (accessible by Admin and PM)
router.get(
  '/developers',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  userController.getDevelopers
);

// Available clients for project creation (accessible by Admin and PM)
router.get(
  '/clients',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  userController.getClients
);

// Admin view all users
router.get('/', authorizeRoles(Role.ADMIN), userController.getAllUsers);

export default router;

