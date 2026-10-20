import { prisma } from './prisma.js';

export async function refundParticipants(gameId: string) {
  const participants = await prisma.gameParticipant.findMany({
    where: { gameId, paymentStatus: 'COMPLETED' },
  });

  for (const participant of participants) {
    await prisma.$transaction([
      prisma.gameParticipant.update({
        where: { id: participant.id },
        data: { paymentStatus: 'REFUNDED' },
      }),
      prisma.user.update({
        where: { id: participant.userId },
        data: { points: { increment: participant.entryFee } },
      }),
      prisma.pointsTransaction.create({
        data: {
          userId: participant.userId,
          gameId,
          transactionType: 'REFUNDED',
          points: participant.entryFee,
          reason: '모집 취소로 인한 포인트 환불',
        },
      }),
    ]);
  }
}
