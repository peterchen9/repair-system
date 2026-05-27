ALTER TABLE "RepairItem" ADD COLUMN "trackingCode" TEXT;

UPDATE "RepairItem"
SET "trackingCode" = 'RS-OLD-' || printf('%06d', "id")
WHERE "trackingCode" IS NULL;

CREATE UNIQUE INDEX "RepairItem_trackingCode_key" ON "RepairItem"("trackingCode");
