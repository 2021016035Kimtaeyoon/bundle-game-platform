import type { GameType, ProductCategory } from '@bgp/shared-types';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  GIFTICON: '기프티콘',
  FIGURE: '피규어',
  ELECTRONICS: '전자제품',
  HIGH_END: '하이엔드',
  ETC: '기타',
};

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  PINBALL: '핀볼',
  HORSE_RACE: '경마',
  QUIZ: '퀴즈',
  SLOT: '슬롯',
  LADDER_CLIMB: '사다리 오르기',
  ICHIBAN_KUJI: '이치방쿠지',
  LADDER_LOTTERY: '사다리 타기',
  COIN_TOSS: '동전 던지기',
  ROULETTE: '룰렛',
  SURVIVE_PUZZLE: '서바이벌 퍼즐',
  NUMBER_GUESS: '숫자 맞추기',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [ProductCategory, string][];
export const GAME_TYPE_OPTIONS = Object.entries(GAME_TYPE_LABELS) as [GameType, string][];

export const CATEGORY_ICON: Record<ProductCategory, string> = {
  GIFTICON: '☕',
  FIGURE: '🧸',
  ELECTRONICS: '🎧',
  HIGH_END: '💎',
  ETC: '🎁',
};

export const CATEGORY_TONE: Record<ProductCategory, string> = {
  GIFTICON: 'tone-mint',
  FIGURE: 'tone-coral',
  ELECTRONICS: 'tone-plain',
  HIGH_END: 'tone-gold',
  ETC: 'tone-mint',
};
