-- AlterTable
ALTER TABLE "users" ADD COLUMN     "managedByAccountId" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tempPasswordExpiresAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managedByAccountId_fkey" FOREIGN KEY ("managedByAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

