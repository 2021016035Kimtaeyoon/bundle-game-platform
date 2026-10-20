import { Router } from 'express';
import { chargePoints, getPointsHistory } from '../controllers/pointsController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.post('/charge', requireAuth, asyncHandler(chargePoints));
router.get('/history', requireAuth, asyncHandler(getPointsHistory));

export default router;
