-- CreateTable
CREATE TABLE "RepairItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receivedDate" DATETIME NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "problemDescription" TEXT NOT NULL,
    "photoUrl" TEXT,
    "completionPreference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RepairRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "repairItemId" INTEGER NOT NULL,
    "acceptedDate" DATETIME,
    "technicianName" TEXT NOT NULL,
    "initialDiagnosis" TEXT,
    "repairable" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "notifiedAt" DATETIME,
    "notes" TEXT,
    "closeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepairRecord_repairItemId_fkey" FOREIGN KEY ("repairItemId") REFERENCES "RepairItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Part" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "safetyStock" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "purchaseSource" TEXT,
    "vendor" TEXT,
    "stockInDate" DATETIME,
    "stockOutDate" DATETIME,
    "photoUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PartTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partId" INTEGER NOT NULL,
    "repairRecordId" INTEGER,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL,
    "transactionDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartTransaction_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PartTransaction_repairRecordId_fkey" FOREIGN KEY ("repairRecordId") REFERENCES "RepairRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairStatusHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "repairItemId" INTEGER NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepairStatusHistory_repairItemId_fkey" FOREIGN KEY ("repairItemId") REFERENCES "RepairItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
