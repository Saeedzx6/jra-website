-- CreateEnum
CREATE TYPE "GradingMode" AS ENUM ('STARS', 'CERTIFICATION');

-- AlterEnum
ALTER TYPE "AssessmentStatus" ADD VALUE 'REQUESTED';

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "cycle" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requestedReason" TEXT;

-- AlterTable
ALTER TABLE "classification_criteria" ADD COLUMN     "code" TEXT,
ADD COLUMN     "detailAr" TEXT,
ADD COLUMN     "detailEn" TEXT,
ADD COLUMN     "groupAr" TEXT,
ADD COLUMN     "groupEn" TEXT,
ADD COLUMN     "mandatory" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "classification_standards" ADD COLUMN     "gradingMode" "GradingMode" NOT NULL DEFAULT 'STARS';
