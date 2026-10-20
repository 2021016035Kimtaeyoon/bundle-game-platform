export type PointsTransactionType = 'EARNED' | 'USED' | 'REFUNDED' | 'PURCHASED';

export interface PointsTransaction {
  id: string;
  userId: string;
  gameId: string | null;
  transactionType: PointsTransactionType;
  points: string;
  reason: string;
  createdAt: string;
}
