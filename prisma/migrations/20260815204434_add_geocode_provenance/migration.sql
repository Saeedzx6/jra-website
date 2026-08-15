-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "geocodeSource" TEXT,
ADD COLUMN     "geocodedAt" TIMESTAMP(3);
