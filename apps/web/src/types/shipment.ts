export interface ShipmentGameSummary {
  id: string;
  title: string;
  productName: string;
  imageUrl: string | null;
}

export interface ShipmentUserSummary {
  id: string;
  username: string;
}

export type ShipmentStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Shipment {
  id: string;
  gameId: string;
  game: ShipmentGameSummary;
  winnerId: string;
  winner?: ShipmentUserSummary;
  organizerId: string;
  organizer?: ShipmentUserSummary;
  courierCompany: string | null;
  trackingNumber: string | null;
  shippingAddress: string;
  status: ShipmentStatus;
  lastCheckedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}
