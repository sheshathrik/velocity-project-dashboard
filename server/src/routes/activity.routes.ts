import { Router } from 'express';
import { activityController } from '../controllers/activity.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { activityQuerySchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticateJWT);

// GET /api/activity - Returns role-filtered last 20 activity records (database-backed)
router.get('/', validateRequest({ query: activityQuerySchema }), activityController.getRecent);

export default router;

