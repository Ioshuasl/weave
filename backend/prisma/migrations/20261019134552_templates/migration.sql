-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('NOTARIAL', 'REGISTRO_CIVIL', 'IMOVEIS', 'PROTESTO', 'RTD_RCPJ', 'OUTROS');

-- CreateEnum
CREATE TYPE "VersionSource" AS ENUM ('MANUAL', 'ASSISTANT', 'RESTORE');

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ReportCategory" NOT NULL DEFAULT 'OUTROS',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "changeSummary" TEXT,
    "source" "VersionSource" NOT NULL DEFAULT 'MANUAL',
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_templates_accountId_archivedAt_idx" ON "report_templates"("accountId", "archivedAt");

-- CreateIndex
CREATE INDEX "report_templates_isSystem_idx" ON "report_templates"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "report_versions_templateId_number_key" ON "report_versions"("templateId", "number");

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
