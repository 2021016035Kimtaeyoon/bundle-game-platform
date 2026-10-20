import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');
const GAME_IMAGES_DIR = path.join(UPLOADS_ROOT, 'games');

mkdirSync(GAME_IMAGES_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, GAME_IMAGES_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const uploadGameImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('지원하지 않는 이미지 형식입니다 (jpg/png/webp/gif만 가능).'));
      return;
    }
    cb(null, true);
  },
}).single('image');

export function uploadGameImageMiddleware(req: Request, res: Response, next: NextFunction) {
  uploadGameImage(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
}

export function gameImagePath(filename: string): string {
  return `/uploads/games/${filename}`;
}
