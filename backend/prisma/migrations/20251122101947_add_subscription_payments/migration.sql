-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
