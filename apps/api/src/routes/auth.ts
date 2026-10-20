import { Router } from 'express';
import { login, refresh, signup } from '../controllers/authController.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.post('/signup', asyncHandler(signup));
router.post('/login', loginRateLimiter, asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));

export default router;
