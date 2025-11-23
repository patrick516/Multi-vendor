/*
  Warnings:

  - Added the required column `userId` to the `CartLead` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CartLead" DROP CONSTRAINT "CartLead_vendorId_fkey";

-- AlterTable
ALTER TABLE "CartLead" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'CONTACT',
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "CartLead" ADD CONSTRAINT "CartLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
