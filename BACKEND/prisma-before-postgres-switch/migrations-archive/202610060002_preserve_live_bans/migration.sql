UPDATE "LiveUserBlock"
SET "isBanned" = true
WHERE "isBanned" = false
  AND "mutedUntil" IS NULL
  AND "removedUntil" IS NULL;
