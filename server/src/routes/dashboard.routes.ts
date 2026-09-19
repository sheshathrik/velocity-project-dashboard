import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/metrics', dashboardController.getMetrics);

export default router;

