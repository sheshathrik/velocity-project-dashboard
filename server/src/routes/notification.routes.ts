import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', notificationController.getAll);
router.patch('/:id/read', notificationController.markRead);
router.post('/mark-all-read', notificationController.markAllRead);

export default router;
