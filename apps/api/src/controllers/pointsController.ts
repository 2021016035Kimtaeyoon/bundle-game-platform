import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const MIN_CHARGE_AMOUNT = 1000;
const MAX_CHARGE_AMOUNT = 1000000;
const CHARGE_METHODS = ['CARD', 'BANK_TRANSFER'] as const;

function isChargeMethod(value: unknown): value is (typeof CHARGE_METHODS)[number] {
  return typeof value === 'string' && (CHARGE_METHODS as readonly string[]).includes(value);
}

export async function chargePoints(req: Request, res: Response) {
  const { amount, paymentMethod } = req.body ?? {};
  const chargeAmount = Number(amount);

  if (
    !Number.isFinite(chargeAmount) ||
    chargeAmount < MIN_CHARGE_AMOUNT ||
    chargeAmount > MAX_CHARGE_AMOUNT
  ) {
    return res.status(400).json({
      error: `충전 금액은 ${MIN_CHARGE_AMOUNT.toLocaleString()}P ~ ${MAX_CHARGE_AMOUNT.toLocaleString()}P 사이여야 합니다.`,
    });
  }
  if (!isChargeMethod(paymentMethod)) {
    return res.status(400).json({ error: '유효하지 않은 결제 수단입니다.' });
  }

  // TODO(STEP5 real PG): TOSS_SECRET_KEY가 설정되면 실제 토스페이먼츠 결제 승인 API 호출로 교체.
  // 현재는 결제 게이트웨이 키가 없어 즉시 충전되는 개발용 시뮬레이션입니다.
  const userId = req.user!.id;
  const [, user] = await prisma.$transaction([
    prisma.pointsTransaction.create({
      data: {
        userId,
        transactionType: 'PURCHASED',
        points: chargeAmount,
        reason: `포인트 충전 (${paymentMethod === 'CARD' ? '카드' : '계좌이체'})`,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { points: { increment: chargeAmount } },
    }),
  ]);

  res.status(201).json({ points: user.points });
}

export async function getPointsHistory(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));

  const [transactions, total] = await Promise.all([
    prisma.pointsTransaction.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pointsTransaction.count({ where: { userId: req.user!.id } }),
  ]);

  res.json({ transactions, pagination: { page, limit, total } });
}
