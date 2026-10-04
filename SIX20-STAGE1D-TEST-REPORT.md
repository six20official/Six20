# SIX20 STAGE 1D TEST REPORT

## Test method and safety

**Date:** 2026-10-04  
**Schema validation:** `npx --no-install prisma validate --schema prisma/schema.prisma` passed.  
**Temporary root:** `C:\Users\USER\AppData\Local\Temp\six20-stage1d-requested-fx7iumy7`.

The four source databases were opened read-only and copied with SQLite's backup API where required. SQL migrations were executed directly with SQLite against temporary targets only. Prisma `migrate diff` inspected the temporary targets. No Prisma migration command was run against a real DB. Test 2 used an unmodified legacy copy; Test 5 used a separate legacy copy with synthetic rows to exercise otherwise-empty notification/message tables. No record values or secrets were printed. No real or backup database was written.

Counts below exclude `_prisma_migrations` and SQLite autoindexes. Source ledgers were inspected using migration name, completion/rollback state, and step count only. The legacy, near-current, and current source ledgers each recorded `20260915022555_init` as successfully applied.

## TEST 1 — EMPTY DATABASE

**PASS**

- **Temporary database:** `C:\Users\USER\AppData\Local\Temp\six20-stage1d-requested-fx7iumy7\test1-empty.db`
- **Migrations:** `20260915022555_init` → `20261004090000_expand_legacy_schema` → `20261004100000_add_live_chat_message` (all executed successfully).
- **Row counts:** Before: empty DB, 0 rows. After: all 31 application tables empty, 0 rows.
- **Table count:** 0 → 31; exact model table set from `schema.prisma`.
- **Index count:** 0 → 51; full expected canonical index set verified.
- **Foreign-key check:** 42 FK entries; `PRAGMA foreign_key_check` returned zero violations. LiveChatMessage has its two expected FKs and both use ON DELETE CASCADE / ON UPDATE CASCADE.
- **Prisma diff:** Empty.
- **Warnings:** None.

## TEST 2 — LEGACY DATABASE

**PASS**

- **Temporary database:** `C:\Users\USER\AppData\Local\Temp\six20-stage1d-requested-fx7iumy7\test2-legacy.db.db`
- **Migrations:** The source copy recorded init as applied; executed `20261004090000_expand_legacy_schema` → `20261004100000_add_live_chat_message`.
- **Row counts before/after:** User 1→1; Video 1→1; Like 1→1; Comment 1→1; Follow 0→0; Notification 0→0; Message 0→0. Existing IDs and available relationships were preserved.
- **Table count:** 7 → 31.
- **Index count:** 4 → 51.
- **Foreign-key check:** 10 → 42 FK entries; `PRAGMA foreign_key_check` returned zero violations.
- **Prisma diff:** Empty.
- **Warnings:** This inspected backup had no Message or Notification rows, and no NULL displayName rows, so those conversions are exercised in Test 5's separate synthetic copy. All timestamp columns were non-NULL after upgrade.

## TEST 3 — NEAR-CURRENT DATABASE

**PASS**

- **Temporary database:** `C:\Users\USER\AppData\Local\Temp\six20-stage1d-requested-fx7iumy7\test3-near-current.db.db`
- **Migration:** `20261004100000_add_live_chat_message` only.
- **Row counts before/after:** All existing table counts unchanged; User 4→4, Video 1→1, Like 1→1, remaining existing tables 0→0. Aggregate existing rows: 6→6.
- **Table count:** 30 → 31.
- **Index count:** 49 → 51.
- **Foreign-key check:** 40 → 42 FK entries; the two added FKs use ON DELETE CASCADE / ON UPDATE CASCADE; `PRAGMA foreign_key_check` returned zero violations.
- **Prisma diff:** Empty.
- **Warnings:** None.

## TEST 4 — CURRENT 31-TABLE DATABASE

**PASS**

- **Temporary database:** `C:\Users\USER\AppData\Local\Temp\six20-stage1d-requested-fx7iumy7\test4-current.db.db`
- **Physical migration applied:** NO.
- **Schema comparison:** Physical model table set matches `schema.prisma`.
- **Rows:** Inspection only; unchanged: User 4, Video 1, Like 1; all other model tables 0 (aggregate 6).
- **Table count:** 31; **index count:** 51.
- **Foreign-key check:** 42 FK entries; `PRAGMA foreign_key_check` returned zero violations.
- **Prisma diff:** Empty.
- **Migration-ledger recommendation:** After exact schema verification in the eventual target environment, mark the two new migrations applied in order, without running their DDL on this current schema:
  1. `prisma migrate resolve --applied 20261004090000_expand_legacy_schema`
  2. `prisma migrate resolve --applied 20261004100000_add_live_chat_message`

  Neither command was executed.
- **Warnings:** Reconcile the ledger only after checking columns, defaults, indexes, and foreign keys—not based only on table count.

## TEST 5 — SYNTHETIC EDGE CASE

**PASS**

- **Temporary database:** `C:\Users\USER\AppData\Local\Temp\six20-stage1d-requested-fx7iumy7\test5-synthetic-edge.db.db`
- **Migrations:** `20261004090000_expand_legacy_schema` → `20261004100000_add_live_chat_message`.
- **Backfill results:** In this disposable copy, a legacy User's displayName was set to NULL, and synthetic `read=true` Notification and valid related Message rows were added. The displayName became its username; User/Comment/Video updatedAt fields were populated; Notification title became `Legacy notification`; isRead remained true. Message id, senderId, receiverId, text, and createdAt were preserved. Existing IDs and relationships remained valid.
- **Row counts before/after:** User 1→1; Video 1→1; Like 1→1; Comment 1→1; Follow 0→0; Notification 1→1; Message 1→1.
- **Table count:** 7 → 31; **index count:** 4 → 51.
- **Foreign-key check:** 10 → 42 FK entries; pre- and post-upgrade `PRAGMA foreign_key_check` returned zero violations.
- **Prisma diff:** Empty.
- **Warnings:** Synthetic values were used only in the disposable copy and not printed.

## FINAL RESULT

OVERALL RESULT: PASS

STAGE 1D DISPOSABLE DATABASE TESTING PASSED.
Safe to proceed to Stage 1E review.

No real project or backup database was modified. No schema or migration file was changed. Nothing was committed or pushed.
