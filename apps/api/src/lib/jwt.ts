import jwt, { type SignOptions } from 'jsonwebtoken';

interface AccessTokenPayload {
  sub: string;
  isOrganizer: boolean;
}

interface RefreshTokenPayload {
  sub: string;
}

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not set');
  return secret;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_TTL ?? '1h') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, getAccessSecret(), options);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_TTL ?? '30d') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, getRefreshSecret(), options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload;
}
