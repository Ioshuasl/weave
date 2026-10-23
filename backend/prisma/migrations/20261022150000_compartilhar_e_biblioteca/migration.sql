-- CreateEnum
CREATE TYPE "ShareMode" AS ENUM ('OFF', 'PUBLIC', 'MEMBERS');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "report_templates" ADD COLUMN     "shareAllowCopy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareMode" "ShareMode" NOT NULL DEFAULT 'OFF',
ADD COLUMN     "shareToken" TEXT;

-- CreateTable
CREATE TABLE "library_submissions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "segment" "AccountSegment",
    "note" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "mockDatasetName" TEXT,
    "mockData" JSONB,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_submissions_publishedTemplateId_key" ON "library_submissions"("publishedTemplateId");

-- CreateIndex
CREATE INDEX "library_submissions_status_createdAt_idx" ON "library_submissions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "library_submissions_templateId_createdAt_idx" ON "library_submissions"("templateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_shareToken_key" ON "report_templates"("shareToken");

-- AddForeignKey
ALTER TABLE "library_submissions" ADD CONSTRAINT "library_submissions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_submissions" ADD CONSTRAINT "library_submissions_publishedTemplateId_fkey" FOREIGN KEY ("publishedTemplateId") REFERENCES "report_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_submissions" ADD CONSTRAINT "library_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_submissions" ADD CONSTRAINT "library_submissions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

