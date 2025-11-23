/*
  Warnings:

  - You are about to drop the column `galleryImageUrls` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `mainImageUrl` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `district` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `categoryId` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "galleryImageUrls",
DROP COLUMN "mainImageUrl",
ADD COLUMN     "area" TEXT,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ALTER COLUMN "categoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN     "mustPay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nextPaymentDue" TIMESTAMP(3),
ADD COLUMN     "subscriptionActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subscriptionAmount" DOUBLE PRECISION NOT NULL DEFAULT 1000;

-- CreateTable
CREATE TABLE "SubscriptionSettings" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
