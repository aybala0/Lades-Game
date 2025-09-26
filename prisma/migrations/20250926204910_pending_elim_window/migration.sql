-- AlterTable
ALTER TABLE "public"."EmailToken" ADD COLUMN     "reportId" TEXT;

-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "disputedAt" TIMESTAMP(3),
ADD COLUMN     "pendingUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "EmailToken_reportId_idx" ON "public"."EmailToken"("reportId");
