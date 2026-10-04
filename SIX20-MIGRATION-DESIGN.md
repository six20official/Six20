# SIX20 Migration Design — Stage 1B

**Purpose:** Design and disposable-test a forward migration path for the four inspected SQLite schema states. This is a review document only. No project schema, migration, or database was changed; no migration was applied to a repository database.

**Date:** 2026-10-04  
**Canonical source:** `BACKEND/prisma/schema.prisma` (SQLite)  
**Immutable migration:** `20260915022555_init`

## Executive result

A tested migration path can take an empty database, either inspected seven-table legacy database, the inspected 30-table near-current database, and the 31-table current database to the exact physical schema represented by `schema.prisma`. The path uses two new forward migration files: a core expansion/reconciliation migration and a LiveChatMessage migration. The legacy step must be a reviewed, data-preserving SQLite rebuild with the nullable staging/backfill steps below; stock Prisma-generated rebuild SQL is unsafe as-is for populated legacy data.

Disposable copies were used for proof. The actual repository databases and tracked migration files were not changed. The current 31-table database already matches the schema; it needs migration-ledger reconciliation only after explicit schema verification. This design is safe to implement for the four observed baselines with preflight checks and reviewed SQL. It is not approval to run it against an unidentified production database.

## 1. Inspected database states

The inventory identified these four databases; all record the initial migration as successful even though their physical schemas differ:

| Baseline | Physical state | Relevant rows from inventory | Initial migration ledger |
|---|---|---|---|
| `BACKEND/prisma/dev.db` | 31 current tables; exact schema match | User 4, Video 1, Like 1 | Applied, one step |
| `BACKEND/prisma/dev-backup.db` | Original seven tables | User 1, Video 1, Like 1, Comment 1 | Applied, one step |
| `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db` | 30 current tables, missing only LiveChatMessage and its indexes/FKs | User 4, Video 1, Like 1 | Applied, one step |
| `BACKUP-PRODUCTION-20261003-215229/prisma/dev-backup.db` | Original seven tables | User 1, Video 1, Like 1, Comment 1 | Applied, one step |

The checked-in initial migration creates only `User`, `Video`, `Like`, `Comment`, `Follow`, `Notification`, and `Message`. It is recorded in all four migration ledgers, so it must remain untouched. The ledger is not evidence that the physical database has only the schema from that migration.

## 2. Canonical Prisma schema review

### 2.1 Models, fields, nullability, defaults, and updatedAt

`R` means required/non-null in the canonical schema; `?` means nullable. `@default` values are database defaults where Prisma emits them. `@updatedAt` is maintained by Prisma Client on writes; it is **not** a SQLite server-side default. Required `updatedAt` values therefore must be explicitly supplied when copying existing rows during a rebuild.

| Model | Required fields | Nullable fields | Defaults / updatedAt |
|---|---|---|---|
| User | id, username, email, passwordHash, displayName, isVerified, isCreator, isSeller, isAffiliate, isAdmin, isBlocked, creatorLevel, createdAt, updatedAt | avatarUrl, bio, phone | id autoincrement; booleans false; creatorLevel 0; createdAt now; updatedAt `@updatedAt` |
| CreatorProfile | id, userId, country, totalViews, totalLikes, totalGifts, createdAt, updatedAt | category, state, city, website | id autoincrement; country `Nigeria`; counts 0; createdAt now; updatedAt `@updatedAt` |
| Video | id, userId, videoUrl, views, shares, isPublic, createdAt, updatedAt | caption, soundTitle | id autoincrement; views/shares 0; isPublic true; createdAt now; updatedAt `@updatedAt` |
| Like | id, userId, videoId, createdAt | — | id autoincrement; createdAt now |
| Comment | id, videoId, userId, text, createdAt, updatedAt | — | id autoincrement; createdAt now; updatedAt `@updatedAt` |
| Follow | id, followerId, followingId, createdAt | — | id autoincrement; createdAt now |
| Notification | id, userId, type, title, message, isRead, createdAt | — | id autoincrement; isRead false; createdAt now |
| Conversation | id, isGroup, createdAt, updatedAt | title | id autoincrement; isGroup false; createdAt now; updatedAt `@updatedAt` |
| ConversationMember | id, conversationId, userId, joinedAt, isAdmin | — | id autoincrement; joinedAt now; isAdmin false |
| Message | id, senderId, receiverId, messageType, isRead, createdAt | conversationId, text, mediaUrl | id autoincrement; messageType `text`; isRead false; createdAt now |
| LiveSession | id, creatorId, title, status, viewerCount, likes, createdAt | description, streamKey, startedAt, endedAt | id autoincrement; status `scheduled`; viewerCount/likes 0; createdAt now |
| LiveViewer | id, liveSessionId, userId, joinedAt | — | id autoincrement; joinedAt now |
| Gift | id, name, slug, category, priceCoins, rarity, sortOrder, isFeatured, isActive, createdAt, updatedAt | description, imageUrl, thumbnailUrl, animationUrl | id autoincrement; rarity `common`; sortOrder 0; isFeatured false; isActive true; createdAt now; updatedAt `@updatedAt` |
| GiftTransaction | id, senderId, receiverId, giftId, quantity, totalCoins, creatorEarn, platformEarn, createdAt | liveSessionId | id autoincrement; quantity 1; createdAt now |
| Wallet | id, userId, coins, balance, earnings, createdAt, updatedAt | — | id autoincrement; balances 0; createdAt now; updatedAt `@updatedAt` |
| WalletTransaction | id, userId, type, amount, status, createdAt | description, reference | id autoincrement; status `completed`; createdAt now |
| Store | id, sellerId, name, isVerified, createdAt, updatedAt | description, logoUrl, location | id autoincrement; isVerified false; createdAt now; updatedAt `@updatedAt` |
| Product | id, storeId, name, price, stock, isActive, createdAt, updatedAt | description, imageUrl, category | id autoincrement; stock 0; isActive true; createdAt now; updatedAt `@updatedAt` |
| ProductReview | id, productId, userId, rating, createdAt | comment | id autoincrement; createdAt now |
| Order | id, buyerId, storeId, total, status, createdAt, updatedAt | address, phone | id autoincrement; status `pending`; createdAt now; updatedAt `@updatedAt` |
| OrderItem | id, orderId, productId, quantity, price | — | id autoincrement |
| SellerRating | id, storeId, buyerId, rating, createdAt | comment | id autoincrement; createdAt now |
| AffiliateProfile | id, userId, commissionRate, totalClicks, totalSales, totalEarned, available, createdAt, updatedAt | — | id autoincrement; commissionRate 20; totals 0; createdAt now; updatedAt `@updatedAt` |
| AffiliateLink | id, affiliateId, code, clicks, sales, createdAt | productId | id autoincrement; clicks/sales 0; createdAt now |
| AffiliateClick | id, affiliateId, linkId, createdAt | — | id autoincrement; createdAt now |
| AffiliateCommission | id, affiliateId, amount, status, createdAt | orderId | id autoincrement; status `pending`; createdAt now |
| Game | id, name, slug, isActive, createdAt | description, imageUrl | id autoincrement; isActive true; createdAt now |
| GameScore | id, gameId, userId, score, createdAt | — | id autoincrement; createdAt now |
| SecuritySession | id, userId, tokenHash, lastActive, expiresAt, isRevoked, createdAt | device, ipAddress, userAgent | id autoincrement; lastActive now; isRevoked false; createdAt now |
| SecurityEvent | id, type, createdAt | userId, ipAddress, userAgent, details | id autoincrement; createdAt now |
| LiveChatMessage | id, liveSessionId, userId, text, createdAt | — | id autoincrement; createdAt now |

### 2.2 Unique constraints and indexes

Canonical unique keys: `User(username)`, `User(email)`, `Like(videoId,userId)`, `Follow(followerId,followingId)`, `ConversationMember(conversationId,userId)`, `LiveViewer(liveSessionId,userId)`, `Gift(slug)`, `Wallet(userId)`, `Store(sellerId)`, `ProductReview(productId,userId)`, `SellerRating(storeId,buyerId)`, `CreatorProfile(userId)`, `AffiliateProfile(userId)`, `AffiliateLink(code)`, and `Game(slug)`.

Canonical non-unique indexes: Message `(senderId)`, `(receiverId)`, `(conversationId)`, `(createdAt)`; Gift `(category)`, `(priceCoins)`, `(rarity)`, `(isActive)`, `(isFeatured)`; GiftTransaction `(senderId)`, `(receiverId)`, `(giftId)`, `(liveSessionId)`; WalletTransaction `(userId)`, `(createdAt)`; Product `(storeId)`, `(category)`; Order `(buyerId)`, `(storeId)`, `(status)`; OrderItem `(orderId)`, `(productId)`; AffiliateLink `(productId)`; AffiliateClick `(linkId)`; AffiliateCommission `(orderId)`, `(status)`; GameScore `(gameId)`, `(userId)`; SecuritySession `(userId)`, `(tokenHash)`, `(expiresAt)`; SecurityEvent `(userId)`, `(type)`, `(createdAt)`; LiveChatMessage `(liveSessionId,createdAt)`, `(userId,createdAt)`.

Legacy Like has a unique index in the opposite column order `(userId,videoId)`. It enforces the same pair uniqueness, but Prisma’s expected key ordering/name differs. The reviewed core SQL drops and recreates this index; verify no duplicate `(videoId,userId)` pairs before doing so.

### 2.3 Foreign keys and relation dependencies

The current schema has these FK edges, all explicitly `onDelete: Cascade` except SecurityEvent’s optional user edge (SQLite default `NO ACTION`; the inspected physical schema reports `SET NULL`, which must be rechecked against the live schema before finalizing SQL):

- `Video.userId → User.id`; `Like.videoId → Video.id`, `Like.userId → User.id`; `Comment.userId → User.id`, `Comment.videoId → Video.id`; both Follow user roles and `Notification.userId → User.id`.
- `ConversationMember.conversationId → Conversation.id` and `.userId → User.id`; `Message.senderId` and `.receiverId → User.id`, optional `.conversationId → Conversation.id`.
- `CreatorProfile.userId → User.id`; `LiveSession.creatorId → User.id`; `LiveViewer.liveSessionId → LiveSession.id`, `.userId → User.id`; `LiveChatMessage.liveSessionId → LiveSession.id`, `.userId → User.id`.
- `GiftTransaction.giftId → Gift.id`, sender/receiver → User; `Wallet.userId → User.id`; `WalletTransaction.userId → User.id`.
- Store seller → User; Product store → Store; ProductReview product → Product and user → User; Order store → Store and buyer → User; OrderItem order → Order and product → Product; SellerRating store → Store and buyer → User.
- AffiliateProfile user → User; AffiliateLink/AffiliateClick/AffiliateCommission affiliateId → AffiliateProfile; GameScore game → Game and user → User; SecuritySession user → User; optional SecurityEvent.userId → User.

The schema intentionally has scalar identifiers with no declared Prisma relation/FK for `GiftTransaction.liveSessionId`, `AffiliateLink.productId`, `AffiliateClick.linkId`, and `AffiliateCommission.orderId`. Do not invent additional constraints in this migration. Creation dependency order is parent-first: User/Conversation/Gift/Store/Game/AffiliateProfile and other roots, then their dependent tables; Chat follows LiveSession and User.

## 3. Recommended migration files and clean-install sequence

Keep `20260915022555_init` byte-for-byte unchanged. Add exactly these reviewed migrations:

1. `BACKEND/prisma/migrations/20261004090000_expand_legacy_schema/migration.sql` — creates the 23 models absent from the seven-table baseline and rebuilds the five existing tables whose definitions differ (`Comment`, `Message`, `Notification`, `User`, `Video`); reconciles Like’s unique-index order and creates all indexes/FKs required by the pre-chat canonical schema.
2. `BACKEND/prisma/migrations/20261004100000_add_live_chat_message/migration.sql` — creates `LiveChatMessage`, its two indexes, and its two FKs.

Clean database sequence:

`empty SQLite → 20260915022555_init → 20261004090000_expand_legacy_schema → 20261004100000_add_live_chat_message → exact current schema`

For a fresh install, `prisma migrate deploy` should apply this committed chain. No model/schema change is required for the proposed target: the canonical schema remains unchanged. The SQL must be reviewed and checked in before any deploy command is run.

## 4. Legacy seven-table upgrade design

Apply the core expansion migration and then the chat migration. The two inspected legacy backups have populated User, Video, Like, and Comment rows; other existing tables are currently empty, but design for populated notifications/messages too.

### 4.1 Staging/backfills before SQLite rebuild

The disposable tested staging preamble uses nullable scratch fields, updates every old row deterministically, then copies into the constrained final table. It does not modify the original table values. Proposed SQL outline:

```sql
ALTER TABLE "User" ADD COLUMN "__mig_displayName" TEXT;
ALTER TABLE "User" ADD COLUMN "__mig_updatedAt" DATETIME;
UPDATE "User"
SET "__mig_displayName" = COALESCE("displayName", "username"),
    "__mig_updatedAt" = COALESCE("updatedAt", "createdAt");

ALTER TABLE "Comment" ADD COLUMN "__mig_updatedAt" DATETIME;
UPDATE "Comment" SET "__mig_updatedAt" = COALESCE("updatedAt", "createdAt");

ALTER TABLE "Video" ADD COLUMN "__mig_updatedAt" DATETIME;
UPDATE "Video" SET "__mig_updatedAt" = COALESCE("updatedAt", "createdAt");

ALTER TABLE "Notification" ADD COLUMN "__mig_title" TEXT;
ALTER TABLE "Notification" ADD COLUMN "__mig_isRead" BOOLEAN;
UPDATE "Notification"
SET "__mig_title" = 'Legacy notification', "__mig_isRead" = "read";
```

Before rebuilding, validate all staged values are non-null, that each old table row count is unchanged, and that notification read-state counts match. If `username` is null/blank in a target (canonical username is required), stop for an explicit data remediation rule; do not silently invent one. `createdAt` is required in the legacy schema and is the deterministic timestamp fallback.

| Legacy change | Staging/default | Deterministic backfill | Validation before final constraint |
|---|---|---|---|
| `User.displayName` nullable → required | nullable `__mig_displayName` | `COALESCE(displayName, username)` | zero staging nulls; fallback source username valid |
| `User.updatedAt` newly required | nullable `__mig_updatedAt` | `COALESCE(updatedAt, createdAt)` | zero nulls; values copied for every User |
| `Comment.updatedAt` newly required | nullable `__mig_updatedAt` | `COALESCE(updatedAt, createdAt)` | zero nulls; counts/IDs preserved |
| `Video.updatedAt` newly required | nullable `__mig_updatedAt` | `COALESCE(updatedAt, createdAt)` | zero nulls; counts/IDs preserved |
| `Notification.title` newly required | nullable `__mig_title` | constant `Legacy notification` | zero nulls; each prior notification has one title |
| `Notification.read` → `isRead` | nullable `__mig_isRead` | exact value copy `read` | old/new true and false counts equal; zero nulls |
| User role/verification/block flags and creatorLevel | final column defaults false/0 | SQLite declared defaults populate old rows | check no nulls and expected defaults |
| Video views/shares/isPublic | final column defaults 0/0/true | SQLite declared defaults populate old rows | check no nulls; existing video values are preserved |
| Message conversationId/mediaUrl | nullable final columns | null (no valid conversation mapping exists) | all old message IDs and user links preserved |
| Message messageType/isRead | final defaults `text`/false | defaults apply to copied legacy rows | validate counts/default values |
| Message text required → nullable | final table allows null | copy old text without alteration | IDs and existing non-null text counts preserved |
| Video caption/soundTitle required → nullable | final table allows null | copy existing values; no backfill needed | values/counts preserved and target columns nullable |

The final table rebuild `INSERT … SELECT` must explicitly map stage fields into final required fields. Examples:

```sql
INSERT INTO "new_User" ("id", "username", "email", "passwordHash", "displayName", "avatarUrl", "bio", "createdAt", "updatedAt")
SELECT "id", "username", "email", "passwordHash", "__mig_displayName", "avatarUrl", "bio", "createdAt", "__mig_updatedAt" FROM "User";

INSERT INTO "new_Notification" ("id", "userId", "type", "title", "message", "isRead", "createdAt")
SELECT "id", "userId", "type", "__mig_title", "message", "__mig_isRead", "createdAt" FROM "Notification";
```

Use equivalent explicit column lists for Comment and Video, selecting staged updatedAt, and Message, retaining IDs, sender/receiver IDs, text, and createdAt. Do not use `SELECT *`. The rebuilt Message sets `conversationId=NULL`, `mediaUrl=NULL`, messageType `text`, and isRead false via nullable fields/defaults.

### 4.2 Backfill validation, constraints, and FK handling

Run precondition queries in the migration/test harness and abort before table swaps if any required staged value is null. Once staged rows pass, construct final tables with schema constraints, copy by explicit column mapping, recreate indexes, swap names, and restore/check FK enforcement. Preserve all primary key IDs and all old FK columns. Validate old per-table row counts against post-migration row counts, `PRAGMA foreign_key_check` returns no rows, all expected indexes exist, and no unexpected FK is introduced. Re-read the schema diff against `schema.prisma` and require an empty diff.

SQLite cannot change nullability in place, hence these five table rebuilds. Take a verified backup before real rollout. A preflight failure must stop before the swap; do not proceed with partial fallback data.

## 5. Near-current 30-table upgrade

For `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db`, the inventory and Prisma diff show only the absent chat table, two indexes, and its two cascade FKs. The exact SQL generated and verified on a disposable copy is:

```sql
CREATE TABLE "LiveChatMessage" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "liveSessionId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveChatMessage_liveSessionId_fkey"
    FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LiveChatMessage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LiveChatMessage_liveSessionId_createdAt_idx"
  ON "LiveChatMessage"("liveSessionId", "createdAt");
CREATE INDEX "LiveChatMessage_userId_createdAt_idx"
  ON "LiveChatMessage"("userId", "createdAt");
```

The new table is empty, so no historical chat rows need copying. Validate both parent tables exist, then compare all table/column/index/FK metadata to the canonical Prisma schema. Do not apply the core rebuild migration physically to this baseline.

## 6. Current 31-table database and migration-ledger reconciliation

`BACKEND/prisma/dev.db` already matches `schema.prisma`; it requires no physical DDL. Do not alter it, reset it, or run a schema sync against it.

After the two new migration directories are created and committed through the project’s normal process, reconcile an environment whose schema has been independently verified as current by recording both migrations as applied using Prisma’s migration-resolution mechanism (`prisma migrate resolve --applied <migration-name>`), in order: core expansion, then chat. This changes migration metadata only; it must not run the SQL. Apply that approach separately to:

- the current 31-table baseline: mark both new migrations applied;
- the 30-table baseline: mark the core expansion applied after exact verification, then deploy/apply the chat migration;
- the legacy seven-table baseline: deploy/apply both new migrations;
- a clean database: deploy the full chain from the initial migration.

Do not mark a migration applied based solely on table count. Verify columns, defaults/nullability, indexes, foreign keys, and migration status first. The inspected databases all currently contain only the initial ledger row; this design intentionally does not rewrite that row or the old migration.

## 7. Disposable proof results

Testing was performed only on temporary SQLite copies under the system temp directory. No repository DB or migration directory was used as a test target. SQL was executed with Python’s SQLite library on disposable copies; Prisma `migrate diff` was run against those copies and the unchanged canonical schema. No `migrate dev`, `migrate reset`, `db push`, or production migration command was run.

| Proof target | SQL used | Result |
|---|---|---|
| Empty DB | immutable init SQL, staged core SQL, chat SQL | 31 tables, 240 columns, 51 non-primary-key indexes, 42 FK entries; zero FK violations; empty Prisma diff |
| Backend legacy copy | staged core SQL, chat SQL | 31 tables; original seven table row counts preserved; zero FK violations; empty Prisma diff |
| Archived legacy copy | staged core SQL, chat SQL | 31 tables; original seven table row counts preserved; zero FK violations; empty Prisma diff |
| Near-current copy | chat SQL only | 31 tables; existing 30 table row counts preserved; zero FK violations; empty Prisma diff |
| Current-schema copy | no physical SQL | already 31 tables; zero FK violations; empty Prisma diff |
| Synthetic legacy edge copy | legacy copy with null displayName and one synthetic `read=true` Notification, then staged SQL | non-null final displayName/title/isRead/updatedAt fields; read state retained; counts preserved; zero FK violations; empty Prisma diff |

For every migrated proof, the sensitive null counts were zero for `User.displayName`, User/Comment/Video `updatedAt`, `Notification.title`, and `Notification.isRead`. Total metadata after each final proof was 31 application tables, 240 columns, 51 indexes (excluding SQLite primary-key autoindexes), and 42 foreign-key entries. No record values were emitted.

Proof limitation: this establishes compatibility with the four inspected snapshots and one synthetic edge fixture. It does not prove compatibility with an unknown hosted production database, unusual triggers/views, an older SQLite runtime, or rows violating the described legacy assumptions. Verify those before implementation/deployment.

## 8. Generated SQL review and potentially destructive operations

The first raw Prisma-generated legacy SQL was unsafe for populated legacy tables: the generated INSERTs did not provide required updatedAt on User/Comment/Video, did not provide required Notification.title, and omitted old Notification.read, which would discard read state. Those omissions were patched in the staged review SQL and the patched variant passed the disposable proof.

The reviewed core SQL contains:

- **5 `DROP TABLE`** operations: Comment, Message, Notification, User, Video. These are SQLite rebuild swaps, not intended data deletion, but are destructive if the preceding copy is incomplete or interrupted.
- **5 `ALTER TABLE … RENAME TO`** operations: each `new_*` replacement becomes the original table name.
- **1 `DROP INDEX`**: old Like composite unique index, recreated in canonical order/name later.
- **5 `INSERT … SELECT`** copy operations for rebuilt tables. These must preserve IDs, FK columns, and all old user content/state; Notification must map `read` into `isRead`.
- **0 `DROP COLUMN`** operations.
- **28 `CREATE TABLE`** statements total: 23 new current model tables plus five replacement tables; 48 `CREATE INDEX` statements in this core diff.
- SQLite foreign-key PRAGMA changes/deferred checking around rebuilds. Re-enable FK enforcement and run `PRAGMA foreign_key_check` before considering the migration successful.
- Required `NOT NULL` declarations in new tables and replacements. Empty new tables are safe; copied legacy rows require the explicit backfills above.

Treat every table drop, index drop, table rename, NOT NULL addition, FK toggle, and data-copy statement as a review gate. Do not run raw `migrate diff --script` output on a populated legacy database without incorporating and testing the backfills and row validations. Migration execution failure after a partially completed SQLite rebuild may not be safely reversible by an inverse SQL script.

## 9. Row-count and integrity validation strategy

Before rollout, privately capture table counts for every existing table and null/duplicate aggregates for migration-sensitive columns. Do not log personal values. After migration:

1. Compare row counts for all pre-existing tables by primary table name. New-model tables should start at zero.
2. Verify primary-key preservation and, where possible, aggregate counts grouped by old foreign-key columns without exposing identifiers.
3. Verify old Like pair uniqueness before index replacement and confirm exactly one final unique constraint on `(videoId,userId)`.
4. Check zero NULLs in required backfilled columns and verify count equality for Notification `read` true/false versus `isRead` true/false.
5. Run `PRAGMA foreign_key_check`; require zero result rows. Inspect `PRAGMA foreign_key_list` and `PRAGMA index_list/index_info` for expected canonical metadata.
6. Run Prisma schema diff against the resulting DB; require `-- This is an empty migration.`
7. Exercise representative app reads/writes in staging only after structural checks; application-level tests are separate from this migration proof.

## 10. Rollback and recovery

- Before any real migration, stop writes as required by the maintenance plan and create a consistent, restorable SQLite backup. Test restoring it to a separate location.
- Deploy first to staging copies made from each actual baseline and retain before/after counts and checks.
- Prefer forward corrective migrations after a successful production schema transition. Do not promise a down migration for SQLite table rebuilds.
- If migration execution fails or integrity validation fails, stop writes and restore the verified pre-migration backup to the planned recovery target. Do not delete or overwrite the source backup; preserve it for investigation.
- For a database already physically at the current schema, migration resolution is ledger bookkeeping only. If resolution is wrong, inspect `_prisma_migrations` and correct the ledger through an approved Prisma recovery procedure; do not reset the database.
- This report performed no rollback/recovery operation against project data.

## 11. Potentially dangerous schema changes summarized

1. Required `@updatedAt` columns need explicit timestamp copy values; Prisma Client behavior does not populate raw SQL copies.
2. Required `Notification.title` has no legacy source. The proposed deterministic fallback is `Legacy notification`; product owners should accept this value before deployment. `Notification.read` must be copied exactly into `isRead`.
3. Null legacy display names use username as deterministic fallback. Validate usernames are non-null and meaningful before use.
4. Five SQLite table rebuilds and one index drop create data-loss risk if copy mappings or recovery are wrong.
5. Required defaults added to old tables must be declared in final DDL; raw inserts must not bypass relevant values.
6. Like index order changes; verify no duplicates and preserve pair uniqueness.
7. Schema and migration ledger diverge in all inspected files; baseline resolution must follow exact physical-schema proof and is not a substitute for applying missing DDL on legacy DBs.
8. Actual production state is unknown. Backups, triggers, custom indexes, or schema drift not in these snapshots can make the migration unsafe.

## 12. Recommended implementation sequence

1. Confirm the production DB provider, exact physical schema and migration ledger; secure and restore-test backups. Determine whether the actual target is legacy, 30-table, or 31-table.
2. Confirm stakeholders accept the two data fallbacks: displayName from username and notification title `Legacy notification`. Validate legacy usernames and notification values through aggregate queries.
3. Create the two migration directories with hand-reviewed SQL. Preserve the initial migration unchanged. Keep required staging/backfill and explicit copy lists; add preconditions/validation appropriate to SQLite migration execution.
4. Recreate all four disposable proofs from untouched source copies and run row-count, null-count, FK, index, and empty Prisma-diff validations.
5. Test the migration chain against a restored staging copy of the actual deployment baseline; verify application reads/writes and backup restore.
6. Plan ledger reconciliation by baseline: deploy for legacy; resolve core then deploy chat for 30-table; resolve both for 31-table; deploy entire chain for empty. Run in staging first and record resulting ledger entries.
7. Schedule production with backup, maintenance/lock strategy, integrity checks, monitoring, and a restore decision point. Do not edit or reapply init; do not reset or sync the production DB.

## Final assessment

**The migration design is safe to implement for the four documented baselines, conditionally.** Disposable proof reached the canonical 31-model physical schema without losing existing table row counts, preserved Notification read state in an edge-case fixture, and passed foreign-key and Prisma schema-diff checks. Implementation should proceed only after production baseline verification, confirmation of fallback semantics, and review of the exact migration SQL. This report does not authorize applying either migration to any real database.
