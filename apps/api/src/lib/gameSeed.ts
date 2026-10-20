import { createHash } from 'node:crypto';

export function computeGameSeed(gameId: string, createdAt: Date): string {
  return `${gameId}:${createdAt.getTime()}:${process.env.GAME_SECRET ?? ''}`;
}

export function computeResultHash(gameId: string, createdAt: Date): string {
  return createHash('sha256').update(computeGameSeed(gameId, createdAt)).digest('hex');
}

function hashSeedToInt(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 공개된 시드로 누구나 동일하게 재현할 수 있는 공정한 셔플.
 * "공 낙하 추첨" 게임의 순위를 여기서 결정한다 (참가자 입력에 의존하지 않음).
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rng = mulberry32(hashSeedToInt(seed));
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
