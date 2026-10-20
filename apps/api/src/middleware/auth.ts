import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, isOrganizer: payload.isOrganizer };
    next();
  } catch {
    res.status(401).json({ error: '토큰이 유효하지 않거나 만료되었습니다.' });
  }
}

export function requireOrganizer(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isOrganizer) {
    return res.status(403).json({ error: '신청자 권한이 필요합니다.' });
  }
  next();
}
