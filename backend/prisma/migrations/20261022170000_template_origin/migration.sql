-- AlterTable
ALTER TABLE "report_templates" ADD COLUMN     "originId" TEXT;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_originId_fkey" FOREIGN KEY ("originId") REFERENCES "report_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill: cópias antigas (modelos da conta com o mesmo nome de um modelo pronto) passam a apontar para a origem
UPDATE "report_templates" AS c
SET "originId" = s."id"
FROM "report_templates" AS s
WHERE c."isSystem" = false AND s."isSystem" = true AND c."name" = s."name" AND c."originId" IS NULL AND s."archivedAt" IS NULL;
