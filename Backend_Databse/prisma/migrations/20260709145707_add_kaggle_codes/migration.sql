/*
  Warnings:

  - A unique constraint covering the columns `[customerCode]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerCode` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productCode` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "customerCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "productCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");
