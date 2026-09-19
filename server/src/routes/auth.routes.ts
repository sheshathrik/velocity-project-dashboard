import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { loginSchema } from '../validators/schemas.js';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticateJWT, authController.getMe);

export default router;
