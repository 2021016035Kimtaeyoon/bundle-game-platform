import { Router } from 'express';
import {
  cancelGame,
  createGame,
  getGame,
  joinGame,
  joinPracticeRound,
  listGames,
  verifyGame,
} from '../controllers/gameController.js';
import { requireAuth, requireOrganizer } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { uploadGameImageMiddleware } from '../lib/upload.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireOrganizer,
  uploadGameImageMiddleware,
  asyncHandler(createGame),
);
router.get('/', asyncHandler(listGames));
router.post('/practice/join', requireAuth, asyncHandler(joinPracticeRound));
router.get('/:id', asyncHandler(getGame));
router.get('/:id/verify', asyncHandler(verifyGame));
router.delete('/:id', requireAuth, asyncHandler(cancelGame));
router.post('/:id/join', requireAuth, asyncHandler(joinGame));

export default router;
