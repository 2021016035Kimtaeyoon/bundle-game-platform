-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('GIFTICON', 'FIGURE', 'ELECTRONICS', 'HIGH_END');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('PINBALL', 'HORSE_RACE', 'QUIZ', 'SLOT', 'LADDER_CLIMB', 'ICHIBAN_KUJI', 'LADDER_LOTTERY', 'COIN_TOSS', 'ROULETTE', 'SURVIVE_PUZZLE', 'NUMBER_GUESS');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('RECRUITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'POINT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PointsTransactionType" AS ENUM ('EARNED', 'USED', 'REFUNDED', 'PURCHASED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'TRANSFERRED', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "points" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalWins" INTEGER NOT NULL DEFAULT 0,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "bankAccount" TEXT,
    "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "productName" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "participantLimit" INTEGER NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "entryFee" DECIMAL(12,2) NOT NULL,
    "totalPool" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "recruitmentStartsAt" TIMESTAMP(3) NOT NULL,
    "recruitmentEndsAt" TIMESTAMP(3) NOT NULL,
    "gameStartsAt" TIMESTAMP(3),
    "gameEndsAt" TIMESTAMP(3),
    "status" "GameStatus" NOT NULL DEFAULT 'RECRUITING',
    "resultHash" TEXT,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_participants" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryFee" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "score" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT,
    "transactionType" "PointsTransactionType" NOT NULL,
    "points" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_results" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DECIMAL(12,2) NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "shippingAddress" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "totalCollected" DECIMAL(12,2) NOT NULL,
    "platformFee" DECIMAL(12,2) NOT NULL,
    "organizerReceives" DECIMAL(12,2) NOT NULL,
    "bankAccount" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "transferredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "games_organizerId_idx" ON "games"("organizerId");

-- CreateIndex
CREATE INDEX "games_status_idx" ON "games"("status");

-- CreateIndex
CREATE INDEX "games_category_idx" ON "games"("category");

-- CreateIndex
CREATE INDEX "games_gameType_idx" ON "games"("gameType");

-- CreateIndex
CREATE INDEX "games_recruitmentEndsAt_idx" ON "games"("recruitmentEndsAt");

-- CreateIndex
CREATE INDEX "game_participants_gameId_idx" ON "game_participants"("gameId");

-- CreateIndex
CREATE INDEX "game_participants_userId_idx" ON "game_participants"("userId");

-- CreateIndex
CREATE INDEX "game_participants_paymentStatus_idx" ON "game_participants"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "game_participants_gameId_userId_key" ON "game_participants"("gameId", "userId");

-- CreateIndex
CREATE INDEX "points_transactions_userId_idx" ON "points_transactions"("userId");

-- CreateIndex
CREATE INDEX "points_transactions_gameId_idx" ON "points_transactions"("gameId");

-- CreateIndex
CREATE INDEX "points_transactions_transactionType_idx" ON "points_transactions"("transactionType");

-- CreateIndex
CREATE INDEX "game_results_gameId_idx" ON "game_results"("gameId");

-- CreateIndex
CREATE INDEX "game_results_userId_idx" ON "game_results"("userId");

-- CreateIndex
CREATE INDEX "shipments_gameId_idx" ON "shipments"("gameId");

-- CreateIndex
CREATE INDEX "shipments_winnerId_idx" ON "shipments"("winnerId");

-- CreateIndex
CREATE INDEX "shipments_organizerId_idx" ON "shipments"("organizerId");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "settlements_gameId_idx" ON "settlements"("gameId");

-- CreateIndex
CREATE INDEX "settlements_organizerId_idx" ON "settlements"("organizerId");

-- CreateIndex
CREATE INDEX "settlements_status_idx" ON "settlements"("status");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

