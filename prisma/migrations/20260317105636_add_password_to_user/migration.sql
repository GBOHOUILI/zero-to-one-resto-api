/*
  Warnings:

  - You are about to drop the column `created_at` on the `CustomDomain` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `CustomDomain` table. All the data in the column will be lost.
  - You are about to drop the column `restaurant_id` on the `CustomDomain` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hostname]` on the table `CustomDomain` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[primaryDomainId]` on the table `Restaurant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hostname` to the `CustomDomain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `CustomDomain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CustomDomain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CustomDomain" DROP CONSTRAINT "CustomDomain_restaurant_id_fkey";

-- DropIndex
DROP INDEX "CustomDomain_domain_key";

-- AlterTable
ALTER TABLE "CustomDomain" DROP COLUMN "created_at",
DROP COLUMN "domain",
DROP COLUMN "restaurant_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hostname" TEXT NOT NULL,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "redirectTo" TEXT,
ADD COLUMN     "restaurantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "restaurantId" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "primaryDomainId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CustomDomain_hostname_key" ON "CustomDomain"("hostname");

-- CreateIndex
CREATE INDEX "CustomDomain_restaurantId_idx" ON "CustomDomain"("restaurantId");

-- CreateIndex
CREATE INDEX "CustomDomain_isPrimary_idx" ON "CustomDomain"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_primaryDomainId_key" ON "Restaurant"("primaryDomainId");

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_primaryDomainId_fkey" FOREIGN KEY ("primaryDomainId") REFERENCES "CustomDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
