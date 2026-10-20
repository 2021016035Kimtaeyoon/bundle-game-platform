import cron from 'node-cron';
import { prisma } from './prisma.js';
import { finalizeGame, scheduleFinalization } from './gameFinalization.js';
import { refundParticipants } from './refunds.js';
import { ROUND_DURATION_MS } from './gameConstants.js';
import { checkDeliveryStatus } from './deliveryTracking.js';
import { markDelivered } from './shipments.js';

async function transitionRecruitingGames() {
  const now = new Date();
  const expired = await prisma.game.findMany({
    where: { status: 'RECRUITING', recruitmentEndsAt: { lte: now } },
  });

  for (const game of expired) {
    if (game.participantCount === game.participantLimit) {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: 'IN_PROGRESS',
          gameStartsAt: game.gameStartsAt ?? now,
          gameEndsAt: new Date(now.getTime() + ROUND_DURATION_MS),
        },
      });
      scheduleFinalization(game.id, ROUND_DURATION_MS);
    } else {
      await refundParticipants(game.id);
      await prisma.game.update({ where: { id: game.id }, data: { status: 'CANCELLED' } });
    }
  }
}

async function completeInProgressGames() {
  const now = new Date();
  const games = await prisma.game.findMany({
    where: { status: 'IN_PROGRESS', gameEndsAt: { lte: now } },
    select: { id: true },
  });

  for (const game of games) {
    await finalizeGame(game.id);
  }
}

async function checkShippedDeliveries() {
  const shipments = await prisma.shipment.findMany({
    where: { status: 'SHIPPED', courierCompany: { not: null }, trackingNumber: { not: null } },
  });

  for (const shipment of shipments) {
    if (!shipment.courierCompany || !shipment.trackingNumber) continue;

    const result = await checkDeliveryStatus(shipment.courierCompany, shipment.trackingNumber);
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { lastCheckedAt: new Date() },
    });

    if (result.checked && result.delivered) {
      await markDelivered(shipment.id);
    }
  }
}

export function startGameStatusCron() {
  return cron.schedule('* * * * *', async () => {
    try {
      await transitionRecruitingGames();
      await completeInProgressGames();
    } catch (error) {
      console.error('game status cron failed:', error);
    }
  });
}

// 택배사 조회 API에 부담을 주지 않도록 10분 간격으로만 확인한다.
export function startDeliveryTrackingCron() {
  return cron.schedule('*/10 * * * *', async () => {
    try {
      await checkShippedDeliveries();
    } catch (error) {
      console.error('delivery tracking cron failed:', error);
    }
  });
}
