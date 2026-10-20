import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { markDelivered } from '../lib/shipments.js';
import { COURIER_OPTIONS } from '../lib/deliveryTracking.js';

function isCourierCode(value: unknown): value is string {
  return typeof value === 'string' && COURIER_OPTIONS.some((c) => c.code === value);
}

const GAME_SELECT = {
  id: true,
  title: true,
  productName: true,
  imageUrl: true,
} as const;

const USER_SELECT = { id: true, username: true } as const;

export async function listMyShipments(req: Request, res: Response) {
  const shipments = await prisma.shipment.findMany({
    where: { winnerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { game: { select: GAME_SELECT }, organizer: { select: USER_SELECT } },
  });
  res.json({ shipments });
}

export async function listOrganizerShipments(req: Request, res: Response) {
  const shipments = await prisma.shipment.findMany({
    where: { organizerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { game: { select: GAME_SELECT }, winner: { select: USER_SELECT } },
  });
  res.json({ shipments });
}

export async function updateShippingAddress(req: Request, res: Response) {
  const { shippingAddress } = req.body ?? {};
  if (typeof shippingAddress !== 'string' || !shippingAddress.trim()) {
    return res.status(400).json({ error: '배송지를 입력해주세요.' });
  }

  const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
  if (!shipment) {
    return res.status(404).json({ error: '배송 정보를 찾을 수 없습니다.' });
  }
  if (shipment.winnerId !== req.user!.id) {
    return res.status(403).json({ error: '본인이 당첨된 배송만 수정할 수 있습니다.' });
  }
  if (shipment.status !== 'PENDING') {
    return res.status(400).json({ error: '이미 발송이 시작되어 배송지를 변경할 수 없습니다.' });
  }

  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: { shippingAddress: shippingAddress.trim() },
  });
  res.json({ shipment: updated });
}

export async function updateShipmentStatus(req: Request, res: Response) {
  const { status, trackingNumber, courierCompany } = req.body ?? {};

  const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
  if (!shipment) {
    return res.status(404).json({ error: '배송 정보를 찾을 수 없습니다.' });
  }
  if (shipment.organizerId !== req.user!.id) {
    return res.status(403).json({ error: '본인이 등록한 라운드의 배송만 관리할 수 있습니다.' });
  }

  if (status === 'SHIPPED') {
    if (shipment.status !== 'PENDING') {
      return res.status(400).json({ error: '대기 중인 배송만 발송 처리할 수 있습니다.' });
    }
    if (!shipment.shippingAddress) {
      return res.status(400).json({ error: '당첨자가 아직 배송지를 입력하지 않았습니다.' });
    }
    if (!isCourierCode(courierCompany)) {
      return res.status(400).json({ error: '택배사를 선택해주세요.' });
    }
    if (typeof trackingNumber !== 'string' || !trackingNumber.trim()) {
      return res.status(400).json({ error: '송장번호를 입력해주세요.' });
    }

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: 'SHIPPED',
        courierCompany,
        trackingNumber: trackingNumber.trim(),
        shippedAt: new Date(),
      },
    });
    // 송장번호가 등록되면 이후 배송 추적 조회로 자동 완료 확인을 시도한다 (lib/cron.ts).
    return res.json({ shipment: updated });
  }

  if (status === 'DELIVERED') {
    if (shipment.status !== 'SHIPPED') {
      return res.status(400).json({ error: '발송된 배송만 배송완료 처리할 수 있습니다.' });
    }

    const updated = await markDelivered(shipment.id);
    return res.json({ shipment: updated });
  }

  return res.status(400).json({ error: '유효하지 않은 상태 값입니다.' });
}

export function getCourierOptions(_req: Request, res: Response) {
  res.json({ couriers: COURIER_OPTIONS });
}
