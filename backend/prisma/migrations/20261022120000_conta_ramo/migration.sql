-- CreateEnum
CREATE TYPE "AccountSegment" AS ENUM ('CARTORIO', 'ADVOCACIA', 'CONTABILIDADE', 'VAREJO', 'CONSTRUCAO', 'MEI', 'EMPRESA', 'OUTRO');

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "segment" "AccountSegment";

