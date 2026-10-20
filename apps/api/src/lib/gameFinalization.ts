import { prisma } from './prisma.js';
import { computeGameSeed, seededShuffle } from './gameSeed.js';

const PARTICIPATION_REWARD_RATE = 0.05;

export function scheduleFinalization(gameId: string, delayMs: number) {
  setTimeout(() => {
    finalizeGame(gameId).catch((error) => {
      console.error(`finalizeGame(${gameId}) failed:`, error);
    });
  }, delayMs);
}

export async function finalizeGame(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { participants: true },
  });

  if (!game || game.status !== 'IN_PROGRESS') {
    // 이미 정산되었거나(중복 호출) 대상 상태가 아니면 안전하게 무시한다.
    return;
  }

  if (game.participants.length === 0) {
    await prisma.game.update({ where: { id: gameId }, data: { status: 'COMPLETED' } });
    return;
  }

  const seed = computeGameSeed(game.id, game.createdAt);
  // 참가자가 낸 점수가 아니라, 게임 생성 시점에 공개된 시드로 결정되는
  // 공 낙하 추첨(핀볼) 결과. 누구나 이 seed로 동일한 순위를 재현해 검증할 수 있다.
  const baseOrder = [...game.participants].sort((a, b) => a.id.localeCompare(b.id));
  const ranked = seededShuffle(baseOrder, seed);

  const winner = ranked[0];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < ranked.length; i++) {
      const participant = ranked[i];
      const rank = i + 1;
      const isWinner = rank === 1;
      const rewardAmount = isWinner ? 0 : Number(participant.entryFee) * PARTICIPATION_REWARD_RATE;

      await tx.gameParticipant.update({
        where: { id: participant.id },
        data: { rank, isWinner },
      });

      await tx.gameResult.create({
        data: {
          gameId: game.id,
          userId: participant.userId,
          rank,
          score: participant.score,
          isWinner,
          rewardAmount,
        },
      });

      if (isWinner) {
        await tx.user.update({
          where: { id: participant.userId },
          data: { totalGames: { increment: 1 }, totalWins: { increment: 1 } },
        });
      } else {
        await tx.user.update({
          where: { id: participant.userId },
          data: { totalGames: { increment: 1 }, points: { increment: rewardAmount } },
        });
        await tx.pointsTransaction.create({
          data: {
            userId: participant.userId,
            gameId: game.id,
            transactionType: 'EARNED',
            points: rewardAmount,
            reason: `게임 참여 보상 (${game.title})`,
          },
        });
      }
    }

    await tx.game.update({
      where: { id: game.id },
      data: { status: 'COMPLETED', winnerId: winner.userId, seedRevealed: seed },
    });

    // 연습 라운드(포인트 상금)는 실물 배송이 없어 배송 레코드를 만들지 않는다.
    if (!game.isPracticeRound) {
      await tx.shipment.create({
        data: {
          gameId: game.id,
          winnerId: winner.userId,
          organizerId: game.organizerId,
          shippingAddress: '',
          status: 'PENDING',
        },
      });
    }
  });
}
