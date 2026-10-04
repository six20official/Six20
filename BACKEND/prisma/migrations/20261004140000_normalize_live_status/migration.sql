UPDATE "LiveSession"
SET "status" = lower("status")
WHERE lower("status") IN ('scheduled', 'live', 'ended')
  AND "status" <> lower("status");
