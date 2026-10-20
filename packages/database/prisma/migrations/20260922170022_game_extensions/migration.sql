-- AlterEnum
ALTER TYPE "ProductCategory" ADD VALUE 'ETC';

-- AlterTable
ALTER TABLE "games"
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "seedRevealed" TEXT,
  ADD COLUMN "isPracticeRound" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "games_isPracticeRound_idx" ON "games"("isPracticeRound");
