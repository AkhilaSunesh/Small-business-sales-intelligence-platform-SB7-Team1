/*
  Warnings:

  - You are about to drop the column `saleDate` on the `SalesTransaction` table. All the data in the column will be lost.
  - Added the required column `transactionDate` to the `SalesTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SalesTransaction" DROP COLUMN "saleDate",
ADD COLUMN     "transactionDate" TIMESTAMP(3) NOT NULL;
