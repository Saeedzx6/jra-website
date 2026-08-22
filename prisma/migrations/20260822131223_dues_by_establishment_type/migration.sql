-- DropIndex
DROP INDEX "dues_schedules_class_stars_effectiveFrom_key";

-- AlterTable
ALTER TABLE "dues_schedules" ADD COLUMN     "establishmentType" "EstablishmentType",
ADD COLUMN     "joiningAmount" DECIMAL(10,3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "dues_schedules_class_establishmentType_stars_effectiveFrom_key" ON "dues_schedules"("class", "establishmentType", "stars", "effectiveFrom");

