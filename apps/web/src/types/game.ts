import type { GameStatus, GameType, ProductCategory } from '@bgp/shared-types';

export interface OrganizerSummary {
  id: string;
  username: string;
  profileImageUrl: string | null;
}

export interface Game {
  id: string;
  organizerId: string;
  organizer?: OrganizerSummary;
  title: string;
  description: string;
  category: ProductCategory;
  productName: string;
  imageUrl: string | null;
  gameType: GameType;
  participantLimit: number;
  participantCount: number;
  entryFee: string;
  totalPool: string;
  recruitmentStartsAt: string;
  recruitmentEndsAt: string;
  gameStartsAt: string | null;
  gameEndsAt: string | null;
  status: GameStatus;
  resultHash: string | null;
  seedRevealed: string | null;
  isPracticeRound: boolean;
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameParticipantSummary {
  id: string;
  userId: string;
  user: OrganizerSummary;
  score: string;
  rank: number | null;
  isWinner: boolean;
  joinedAt: string;
}

export interface GameDetail extends Game {
  organizer: OrganizerSummary;
  winner: OrganizerSummary | null;
  participants: GameParticipantSummary[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
