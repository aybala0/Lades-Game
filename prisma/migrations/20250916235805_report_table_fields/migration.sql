/*
  Warnings:

  - Added the required column `roundId` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "roundId" TEXT NOT NULL;
