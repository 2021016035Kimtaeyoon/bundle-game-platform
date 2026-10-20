import type { Request, Response } from 'express';
import type { Prisma } from '@bgp/database';
import { prisma } from '../lib/prisma.js';
import { gameImagePath } from '../lib/upload.js';
import { refundParticipants } from '../lib/refunds.js';
import { computeResultHash } from '../lib/gameSeed.js';
import { scheduleFinalization } from '../lib/gameFinalization.js';
import {
  PRACTICE_ENTRY_FEE,
  PRACTICE_PARTICIPANT_LIMIT,
  PRACTICE_RECRUITMENT_WINDOW_MS,
  ROUND_DURATION_MS,
} from '../lib/gameConstants.js';

const CATEGORIES = ['GIFTICON', 'FIGURE', 'ELECTRONICS', 'HIGH_END', 'ETC'] as const;
const GAME_TYPES = [
  'PINBALL',
  'HORSE_RACE',
  'QUIZ',
  'SLOT',
  'LADDER_CLIMB',
  'ICHIBAN_KUJI',
  'LADDER_LOTTERY',
  'COIN_TOSS',
  'ROULETTE',
  'SURVIVE_PUZZLE',
  'NUMBER_GUESS',
] as const;
const STATUSES = ['RECRUITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
const SORT_OPTIONS = ['latest', 'deadline', 'popular'] as const;

type Category = (typeof CATEGORIES)[number];
type GameTypeValue = (typeof GAME_TYPES)[number];
type Status = (typeof STATUSES)[number];

function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

function isGameType(value: unknown): value is GameTypeValue {
  return typeof value === 'string' && (GAME_TYPES as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

const ORGANIZER_SELECT = { id: true, username: true, profileImageUrl: true } as const;

export async function createGame(req: Request, res: Response) {
  const {
    title,
    description,
    category,
    productName,
    gameType,
    participantLimit,
    entryFee,
    recruitmentEndsAt,
    gameStartsAt,
  } = req.body ?? {};

  if (!title || !description || !category || !productName || !gameType || !recruitmentEndsAt) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
  }
  if (!isCategory(category)) {
    return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
  }
  if (!isGameType(gameType)) {
    return res.status(400).json({ error: '유효하지 않은 게임 타입입니다.' });
  }

  const limit = Number(participantLimit);
  if (!Number.isInteger(limit) || limit < 2) {
    return res.status(400).json({ error: '참가 인원은 2명 이상이어야 합니다.' });
  }

  const fee = Number(entryFee);
  if (!Number.isFinite(fee) || fee <= 0) {
    return res.status(400).json({ error: '참가비는 0보다 커야 합니다.' });
  }

  const recruitmentEndsAtDate = new Date(recruitmentEndsAt);
  if (Number.isNaN(recruitmentEndsAtDate.getTime()) || recruitmentEndsAtDate <= new Date()) {
    return res.status(400).json({ error: '모집 마감일은 현재 시각 이후여야 합니다.' });
  }

  const imageUrl = req.file ? gameImagePath(req.file.filename) : null;

  const game = await prisma.game.create({
    data: {
      organizerId: req.user!.id,
      title,
      description,
      category,
      productName,
      imageUrl,
      gameType,
      participantLimit: limit,
      entryFee: fee,
      recruitmentStartsAt: new Date(),
      recruitmentEndsAt: recruitmentEndsAtDate,
      gameStartsAt: gameStartsAt ? new Date(gameStartsAt) : null,
      status: 'RECRUITING',
    },
  });

  const resultHash = computeResultHash(game.id, game.createdAt);
  const updatedGame = await prisma.game.update({
    where: { id: game.id },
    data: { resultHash },
  });

  res.status(201).json({ game: updatedGame });
}

export async function listGames(req: Request, res: Response) {
  const query = req.query as Record<string, string | undefined>;
  const { category, gameType, status, minEntryFee, maxEntryFee } = query;
  const sort = SORT_OPTIONS.includes(query.sort as (typeof SORT_OPTIONS)[number])
    ? (query.sort as (typeof SORT_OPTIONS)[number])
    : 'latest';

  const where: Prisma.GameWhereInput = {};
  if (isCategory(category)) where.category = category;
  if (isGameType(gameType)) where.gameType = gameType;
  if (isStatus(status)) where.status = status;

  const min = minEntryFee !== undefined ? Number(minEntryFee) : undefined;
  const max = maxEntryFee !== undefined ? Number(maxEntryFee) : undefined;
  if (Number.isFinite(min) || Number.isFinite(max)) {
    where.entryFee = {
      ...(Number.isFinite(min) ? { gte: min } : {}),
      ...(Number.isFinite(max) ? { lte: max } : {}),
    };
  }

  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));

  const orderBy: Prisma.GameOrderByWithRelationInput =
    sort === 'deadline'
      ? { recruitmentEndsAt: 'asc' }
      : sort === 'popular'
        ? { participantCount: 'desc' }
        : { createdAt: 'desc' };

  const [games, total] = await Promise.all([
    prisma.game.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { organizer: { select: ORGANIZER_SELECT } },
    }),
    prisma.game.count({ where }),
  ]);

  res.json({
    games,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

export async function getGame(req: Request, res: Response) {
  const game = await prisma.game.findUnique({
    where: { id: req.params.id },
    include: {
      organizer: { select: ORGANIZER_SELECT },
      winner: { select: ORGANIZER_SELECT },
      participants: {
        orderBy: { joinedAt: 'desc' },
        take: 10,
        include: { user: { select: ORGANIZER_SELECT } },
      },
    },
  });

  if (!game) {
    return res.status(404).json({ error: '모집글을 찾을 수 없습니다.' });
  }

  res.json({ game });
}

export async function verifyGame(req: Request, res: Response) {
  const game = await prisma.game.findUnique({
    where: { id: req.params.id },
    include: {
      results: {
        orderBy: { rank: 'asc' },
        include: { user: { select: ORGANIZER_SELECT } },
      },
    },
  });

  if (!game) {
    return res.status(404).json({ error: '모집글을 찾을 수 없습니다.' });
  }
  if (game.status !== 'COMPLETED') {
    return res.status(400).json({ error: '게임이 종료된 이후에만 결과를 검증할 수 있습니다.' });
  }

  res.json({
    gameId: game.id,
    title: game.title,
    originalSeed: game.seedRevealed,
    resultHash: game.resultHash,
    results: game.results.map((result) => ({
      rank: result.rank,
      username: result.user.username,
      isWinner: result.isWinner,
      rewardAmount: result.rewardAmount,
    })),
    verificationInstructions:
      'originalSeed 문자열을 SHA-256으로 해싱한 값이 resultHash와 일치하면, 게임이 시작되기 전에 ' +
      '이미 정해져 있던 규칙(gameId:createdAt:서버비밀키)대로 결과가 나왔다는 뜻입니다. 순위는 이 ' +
      'seed로 초기화한 결정론적 셔플(Fisher–Yates + mulberry32)로 정해지므로, 누구나 동일한 seed로 ' +
      '동일한 순서를 재현할 수 있습니다.',
  });
}

export async function cancelGame(req: Request, res: Response) {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } });
  if (!game) {
    return res.status(404).json({ error: '모집글을 찾을 수 없습니다.' });
  }
  if (game.organizerId !== req.user!.id) {
    return res.status(403).json({ error: '본인이 등록한 모집글만 취소할 수 있습니다.' });
  }
  if (game.status !== 'RECRUITING') {
    return res.status(400).json({ error: '모집 중인 게임만 취소할 수 있습니다.' });
  }

  await refundParticipants(game.id);
  await prisma.game.update({ where: { id: game.id }, data: { status: 'CANCELLED' } });

  res.status(204).send();
}

interface JoinFailure {
  ok: false;
  status: number;
  message: string;
}

interface JoinSuccess {
  ok: true;
  game: Prisma.GameGetPayload<object>;
  isFull: boolean;
}

async function joinGameById(gameId: string, userId: string): Promise<JoinFailure | JoinSuccess> {
  const result = await prisma.$transaction(async (tx): Promise<JoinFailure | JoinSuccess> => {
    const game = await tx.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return { ok: false, status: 404, message: '모집글을 찾을 수 없습니다.' };
    }
    if (game.status !== 'RECRUITING') {
      return { ok: false, status: 400, message: '모집이 종료된 라운드입니다.' };
    }

    const existing = await tx.gameParticipant.findUnique({
      where: { gameId_userId: { gameId, userId } },
    });
    if (existing) {
      return { ok: false, status: 409, message: '이미 참여한 라운드입니다.' };
    }

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { ok: false, status: 404, message: '사용자를 찾을 수 없습니다.' };
    }

    const entryFee = Number(game.entryFee);
    if (Number(user.points) < entryFee) {
      return { ok: false, status: 400, message: '포인트가 부족합니다. 포인트를 충전해주세요.' };
    }

    await tx.user.update({ where: { id: userId }, data: { points: { decrement: entryFee } } });
    await tx.pointsTransaction.create({
      data: {
        userId,
        gameId,
        transactionType: 'USED',
        points: entryFee,
        reason: `게임 참여 (${game.title})`,
      },
    });
    await tx.gameParticipant.create({
      data: { gameId, userId, entryFee, paymentMethod: 'POINT', paymentStatus: 'COMPLETED' },
    });

    const newParticipantCount = game.participantCount + 1;
    const isFull = newParticipantCount >= game.participantLimit;
    const now = new Date();

    const updatedGame = await tx.game.update({
      where: { id: gameId },
      data: {
        participantCount: { increment: 1 },
        totalPool: { increment: entryFee },
        ...(isFull
          ? {
              status: 'IN_PROGRESS' as const,
              gameStartsAt: now,
              gameEndsAt: new Date(now.getTime() + ROUND_DURATION_MS),
            }
          : {}),
      },
    });

    return { ok: true, game: updatedGame, isFull };
  });

  if (result.ok && result.isFull) {
    scheduleFinalization(result.game.id, ROUND_DURATION_MS);
  }

  return result;
}

export async function joinGame(req: Request, res: Response) {
  const result = await joinGameById(req.params.id, req.user!.id);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.message });
  }
  res.status(200).json({ game: result.game });
}

export async function joinPracticeRound(req: Request, res: Response) {
  const { gameType } = req.body ?? {};
  if (!isGameType(gameType)) {
    return res.status(400).json({ error: '유효하지 않은 게임 타입입니다.' });
  }

  const userId = req.user!.id;

  const existingParticipation = await prisma.gameParticipant.findFirst({
    where: { userId, game: { isPracticeRound: true, gameType, status: 'RECRUITING' } },
    select: { gameId: true },
  });
  if (existingParticipation) {
    return res.json({ gameId: existingParticipation.gameId });
  }

  let openRound = await prisma.game.findFirst({
    where: {
      isPracticeRound: true,
      gameType,
      status: 'RECRUITING',
      participantCount: { lt: PRACTICE_PARTICIPANT_LIMIT },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!openRound) {
    const now = new Date();
    const created = await prisma.game.create({
      data: {
        organizerId: userId,
        title: '연습전',
        description: '소액 포인트로 즐기는 연습 라운드입니다. 실제 상품 대신 포인트를 겁니다.',
        category: 'ETC',
        productName: '포인트 상금',
        gameType,
        participantLimit: PRACTICE_PARTICIPANT_LIMIT,
        entryFee: PRACTICE_ENTRY_FEE,
        recruitmentStartsAt: now,
        recruitmentEndsAt: new Date(now.getTime() + PRACTICE_RECRUITMENT_WINDOW_MS),
        status: 'RECRUITING',
        isPracticeRound: true,
      },
    });

    const resultHash = computeResultHash(created.id, created.createdAt);
    openRound = await prisma.game.update({ where: { id: created.id }, data: { resultHash } });
  }

  const result = await joinGameById(openRound.id, userId);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.message });
  }
  res.json({ gameId: result.game.id });
}
