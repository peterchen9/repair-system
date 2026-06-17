UPDATE "RepairItem"
SET "trackingCode" = strftime(
  '%Y%m%d%H%M%S',
  datetime(("createdAt" / 1000), 'unixepoch', '+' || "id" || ' seconds', '+8 hours')
)
WHERE "trackingCode" IS NULL
   OR length("trackingCode") != 14
   OR "trackingCode" GLOB '*[^0-9]*';
