import { prisma } from './prisma.js';
import { processSettlement } from './settlement.js';

export async function markDelivered(shipmentId: string) {
  const shipment = await prisma.shipment.update({
    where: { id: shipmentId },
    data: { status: 'DELIVERED', deliveredAt: new Date() },
  });
  await processSettlement(shipment.gameId);
  return shipment;
}
