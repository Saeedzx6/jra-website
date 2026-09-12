-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "aboutVideoUrl" TEXT;

-- CreateTable
CREATE TABLE "about_slides" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "captionEn" TEXT,
    "captionAr" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "about_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "about_slides_isActive_sortOrder_idx" ON "about_slides"("isActive", "sortOrder");

