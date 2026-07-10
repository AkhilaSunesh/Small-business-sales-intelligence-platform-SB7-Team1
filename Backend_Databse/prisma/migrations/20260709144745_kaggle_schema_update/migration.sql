-- AlterTable
ALTER TABLE "SalesTransaction" ADD COLUMN     "discountApplied" DOUBLE PRECISION,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "storeLocation" TEXT;
