/*
  Warnings:

  - A unique constraint covering the columns `[userId,registrationNumber]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Vehicle_registrationNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_registrationNumber_key" ON "Vehicle"("userId", "registrationNumber");
