-- AlterTable
ALTER TABLE "shipments"
  ADD COLUMN "courierCompany" TEXT,
  ADD COLUMN "lastCheckedAt" TIMESTAMP(3);
