-- CreateTable
CREATE TABLE "mock_datasets" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mock_datasets_templateId_idx" ON "mock_datasets"("templateId");

-- AddForeignKey
ALTER TABLE "mock_datasets" ADD CONSTRAINT "mock_datasets_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
