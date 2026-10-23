-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarFile" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "jobRole" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
ADD COLUMN     "username" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

