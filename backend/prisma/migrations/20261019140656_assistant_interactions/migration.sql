-- CreateTable
CREATE TABLE "assistant_interactions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "kind" TEXT NOT NULL,
    "usage" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_interactions_templateId_createdAt_idx" ON "assistant_interactions"("templateId", "createdAt");

-- AddForeignKey
ALTER TABLE "assistant_interactions" ADD CONSTRAINT "assistant_interactions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_interactions" ADD CONSTRAINT "assistant_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
