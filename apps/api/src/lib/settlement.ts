import { prisma } from './prisma.js';

const PLATFORM_FEE_RATE = 0.1;

/**
 * 배송 완료 확인 시 호출된다. 실제 은행 송금 대신, 모인 포인트에서
 * 플랫폼 수수료를 뗀 나머지를 주최자 포인트 잔액으로 즉시 정산한다.
 */
export async function processSettlement(gameId: string) {
  const existing = await prisma.settlement.findFirst({ where: { gameId } });
  if (existing) return existing;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new Error(`Game ${gameId} not found`);

  const totalCollected = Number(game.totalPool);
  const platformFee = totalCollected * PLATFORM_FEE_RATE;
  const organizerReceives = totalCollected - platformFee;

  return prisma.$transaction(async (tx) => {
    const settlement = await tx.settlement.create({
      data: {
        gameId: game.id,
        organizerId: game.organizerId,
        totalCollected,
        platformFee,
        organizerReceives,
        bankAccount: '포인트 자동 정산',
        status: 'COMPLETED',
        transferredAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: game.organizerId },
      data: { points: { increment: organizerReceives } },
    });

    await tx.pointsTransaction.create({
      data: {
        userId: game.organizerId,
        gameId: game.id,
        transactionType: 'EARNED',
        points: organizerReceives,
        reason: `라운드 정산 (${game.title}, 수수료 10% 제외)`,
      },
    });

    return settlement;
  });
}
