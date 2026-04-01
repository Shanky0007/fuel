-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "phone" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "vehicleType" TEXT,
    "fuelType" TEXT,
    "assignedRegion" TEXT,
    "assignedStationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_assignedStationId_fkey" FOREIGN KEY ("assignedStationId") REFERENCES "Station" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("assignedRegion", "city", "country", "createdAt", "email", "fuelType", "id", "name", "password", "phone", "region", "role", "vehicleType") SELECT "assignedRegion", "city", "country", "createdAt", "email", "fuelType", "id", "name", "password", "phone", "region", "role", "vehicleType" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
