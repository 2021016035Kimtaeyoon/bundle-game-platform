export interface VerificationResultRow {
  rank: number;
  username: string;
  isWinner: boolean;
  rewardAmount: string;
}

export interface VerificationData {
  gameId: string;
  title: string;
  originalSeed: string | null;
  resultHash: string | null;
  results: VerificationResultRow[];
  verificationInstructions: string;
}
