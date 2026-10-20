import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import type { User } from '@bgp/database';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

function issueTokens(user: User) {
  const accessToken = signAccessToken({ sub: user.id, isOrganizer: user.isOrganizer });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken };
}

export async function signup(req: Request, res: Response) {
  const { email, password, username, phone } = req.body ?? {};

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'email, password, username은 필수입니다.' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: '이메일 형식이 올바르지 않습니다.' });
  }
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ error: '비밀번호는 8자 이상, 영문+숫자 조합이어야 합니다.' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: '이미 가입된 이메일입니다.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, phone: phone || null, passwordHash },
  });

  const tokens = issueTokens(user);
  res.status(201).json({ user: sanitizeUser(user), ...tokens });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email, password는 필수입니다.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const tokens = issueTokens(user);
  res.json({ user: sanitizeUser(user), ...tokens });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body ?? {};

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken은 필수입니다.' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: '유효하지 않은 사용자입니다.' });
    }
    const accessToken = signAccessToken({ sub: user.id, isOrganizer: user.isOrganizer });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'refreshToken이 유효하지 않거나 만료되었습니다.' });
  }
}
