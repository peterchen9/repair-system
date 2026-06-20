UPDATE "RepairItem"
SET "trackingCode" = 'RS-' || upper(hex(randomblob(8)))
WHERE "trackingCode" IS NULL
   OR "trackingCode" NOT LIKE 'RS-%'
   OR length("trackingCode") != 19;
