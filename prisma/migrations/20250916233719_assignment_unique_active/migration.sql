/*
  Warnings:

  - You are about to drop the column `evidence` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `roundId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the `Round` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roundId,hunterId,active]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roundId,targetId,active]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Assignment_roundId_hunterId_key";

-- DropIndex
DROP INDEX "public"."Assignment_roundId_targetId_key";

-- AlterTable
ALTER TABLE "public"."Report" DROP COLUMN "evidence",
DROP COLUMN "roundId";

-- DropTable
DROP TABLE "public"."Round";

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_roundId_hunterId_active_key" ON "public"."Assignment"("roundId", "hunterId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_roundId_targetId_active_key" ON "public"."Assignment"("roundId", "targetId", "active");
