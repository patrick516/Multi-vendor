-- DropForeignKey
ALTER TABLE "CartLead" DROP CONSTRAINT "CartLead_userId_fkey";

-- AlterTable
ALTER TABLE "CartLead" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CartLead" ADD CONSTRAINT "CartLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
