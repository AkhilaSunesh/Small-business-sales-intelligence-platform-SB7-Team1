/*
  Warnings:

  - You are about to drop the column `address` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discountApplied` on the `SalesTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `SalesTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `storeLocation` on the `SalesTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceNo]` on the table `SalesTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Customer_email_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "address",
DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "createdAt",
DROP COLUMN "price";

-- AlterTable
ALTER TABLE "SalesTransaction" DROP COLUMN "discountApplied",
DROP COLUMN "paymentMethod",
DROP COLUMN "storeLocation",
ALTER COLUMN "saleDate" DROP DEFAULT,
ALTER COLUMN "invoiceNo" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "password";

-- CreateIndex
CREATE UNIQUE INDEX "SalesTransaction_invoiceNo_key" ON "SalesTransaction"("invoiceNo");
