-- CreateEnum
CREATE TYPE "TagColor" AS ENUM ('DEFAULT', 'GRAY', 'BROWN', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE', 'PINK', 'RED');

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "color" "TagColor" NOT NULL DEFAULT 'GRAY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_tags" (
    "templateId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "template_tags_pkey" PRIMARY KEY ("templateId","tagId")
);

-- CreateIndex
CREATE INDEX "tags_accountId_idx" ON "tags"("accountId");

-- CreateIndex
CREATE INDEX "template_tags_tagId_idx" ON "template_tags"("tagId");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migração de dados: cada categoria antiga vira uma tag do sistema (accountId nulo)
INSERT INTO "tags" ("id", "accountId", "name", "color") VALUES
  (gen_random_uuid()::text, NULL, 'Notariado', 'BLUE'),
  (gen_random_uuid()::text, NULL, 'Registro Civil', 'GREEN'),
  (gen_random_uuid()::text, NULL, 'Imóveis', 'ORANGE'),
  (gen_random_uuid()::text, NULL, 'Protesto', 'RED'),
  (gen_random_uuid()::text, NULL, 'RTD/RCPJ', 'PURPLE'),
  (gen_random_uuid()::text, NULL, 'Outros', 'GRAY');

INSERT INTO "template_tags" ("templateId", "tagId")
SELECT t."id", g."id"
FROM "report_templates" t
JOIN "tags" g ON g."accountId" IS NULL AND g."name" = CASE t."category"
  WHEN 'NOTARIAL' THEN 'Notariado'
  WHEN 'REGISTRO_CIVIL' THEN 'Registro Civil'
  WHEN 'IMOVEIS' THEN 'Imóveis'
  WHEN 'PROTESTO' THEN 'Protesto'
  WHEN 'RTD_RCPJ' THEN 'RTD/RCPJ'
  ELSE 'Outros'
END;

-- AlterTable
ALTER TABLE "report_templates" DROP COLUMN "category";

-- DropEnum
DROP TYPE "ReportCategory";
