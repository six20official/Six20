# SIX20 Database and Migration Inventory

**Scope:** Read-only inventory of `BACKEND/prisma/schema.prisma`, every file under `BACKEND/prisma/migrations`, and every repository SQLite database found by extension (`.db`, `.sqlite`, `.sqlite3`).  
**Safety:** Database inspection used SQLite read-only connections (`mode=ro`). Prisma schema comparison used `prisma migrate diff` with SQL printed to stdout only; no diff was saved, and no migration was created or applied. No database values, passwords, tokens, email contents, or other user record values were read or printed. Row counts below are aggregate metadata only.  
**Date:** 2026-10-04

## Executive findings

- The backend-configured main local SQLite database is `BACKEND/prisma/dev.db`, resolved from the local `DATABASE_URL` in `BACKEND/.env`. Its 31 application tables match the current Prisma schema exactly according to Prisma's schema diff.
- Four SQLite files were found: the main database, one backend sibling backup, and two databases inside the tracked production-backup directory.
- All four databases have one completed `_prisma_migrations` entry for `20260915022555_init`, with one applied step and no recorded rollback. Therefore the initial migration appears applied in all four.
- The migration ledger does not describe actual schema state. The initial migration SQL creates only seven old application tables. The main local database has 31 application tables despite having only that one ledger entry, indicating schema changes not represented by checked-in migrations.
- `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db` has 30 application tables and lacks only `LiveChatMessage` and its two indexes compared with the current schema.
- Both `dev-backup.db` files have only the seven legacy tables. They are missing 24 current model tables and have material column/index differences in existing tables.
- **It is not safe to generate/apply one additive migration yet.** First decide which database state(s) must be supported and create explicit safe backfills for table rebuilds. The schema-only diff for legacy databases includes rebuilds that introduce required columns without defaults while populated tables have rows.

## Prisma schema and checked-in migration files

### Current schema

`BACKEND/prisma/schema.prisma` configures `provider = "sqlite"` and reads `DATABASE_URL`. It defines these 31 application models:

`User`, `CreatorProfile`, `Video`, `Like`, `Comment`, `Follow`, `Notification`, `Conversation`, `ConversationMember`, `Message`, `LiveSession`, `LiveViewer`, `Gift`, `GiftTransaction`, `Wallet`, `WalletTransaction`, `Store`, `Product`, `ProductReview`, `Order`, `OrderItem`, `SellerRating`, `AffiliateProfile`, `AffiliateLink`, `AffiliateClick`, `AffiliateCommission`, `Game`, `GameScore`, `SecuritySession`, `SecurityEvent`, and `LiveChatMessage`.

Current-schema unique constraints include usernames/emails; video/user likes; follower/following pairs; conversation/user membership; LIVE/user viewers; gift slug; wallet user; store seller; product/user review; store/buyer seller rating; creator profile user; affiliate profile user; affiliate link code; and game slug.

Current-schema named non-unique indexes cover message sender/receiver/conversation/time; gift category/price/rarity/active/featured; gift transaction sender/receiver/gift/live session; wallet transaction user/time; product store/category; order buyer/store/status; order-item order/product; affiliate link product, click link, commission order/status; game-score game/user; security-session user/token/expiry; security-event user/type/time; and LIVE chat session/time and user/time.

The model also defines foreign keys for user-owned content and profiles, social relations, conversation membership/messages, LIVE sessions/viewers/chat, gifts and wallet records, marketplace records, game scores, affiliate records, and security sessions/events. The main local DB's semantic Prisma diff is empty, confirming that its columns, indexes, and foreign keys match the schema. A full column/FK listing for that database is therefore the schema model list above; the tables and row metadata are listed below.

### Migration files

Files present under `BACKEND/prisma/migrations`:

- `BACKEND/prisma/migrations/migration_lock.toml` — provider is `sqlite`.
- `BACKEND/prisma/migrations/20260915022555_init/migration.sql` — creates `User`, `Video`, `Like`, `Comment`, `Follow`, `Notification`, and `Message`, plus unique indexes for `User.username`, `User.email`, `Like(userId, videoId)`, and `Follow(followerId, followingId)`.

There are no later migration directories or migration SQL files. The init SQL is an older schema than `schema.prisma` and must not be edited if it has been applied to any environment.

## SQLite files discovered

The repository scan found exactly these SQLite files by `.db`, `.sqlite`, and `.sqlite3` extension:

| Database | Role/evidence | Application tables | Nonzero aggregate row counts | Prisma ledger |
|---|---|---:|---|---|
| `BACKEND/prisma/dev.db` | Main local DB: `BACKEND/.env` resolves its SQLite URL here; file exists | 31 | `User=4`, `Video=1`, `Like=1`; all other application tables are empty | Init migration completed; not rolled back; 1 step |
| `BACKEND/prisma/dev-backup.db` | Backend sibling backup; old schema | 7 | `User=1`, `Video=1`, `Like=1`, `Comment=1`; other application tables are empty | Init migration completed; not rolled back; 1 step |
| `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db` | Tracked production-backup snapshot; current schema minus latest chat model | 30 | `User=4`, `Video=1`, `Like=1`; all other application tables are empty | Init migration completed; not rolled back; 1 step |
| `BACKUP-PRODUCTION-20261003-215229/prisma/dev-backup.db` | Tracked production-backup snapshot; same legacy schema family as backend sibling backup | 7 | `User=1`, `Video=1`, `Like=1`, `Comment=1`; other application tables are empty | Init migration completed; not rolled back; 1 step |

Each database also contains `_prisma_migrations` with one row. Counts above exclude `_prisma_migrations`; no record contents were inspected. The `User=...` notation is a table count only and does not disclose identities or field values.

## Per-database schema inventory

### `BACKEND/prisma/dev.db` — configured main local database

- **Tables:** All 31 application tables in the current Prisma schema, plus `_prisma_migrations`.
- **Columns, indexes, foreign keys:** Prisma `migrate diff --from-url … --to-schema-datamodel … --script` returned `-- This is an empty migration.` The actual schema matches the current datamodel; no missing or extra model columns/indexes/FKs were identified.
- **Row counts:** `User=4`, `Video=1`, `Like=1`; remaining 28 application tables have zero rows. `_prisma_migrations` has one row.
- **Migration history:** Exactly one successful record for `20260915022555_init`; `finished_at` is set, `rolled_back_at` is null, `applied_steps_count=1`.
- **Assessment:** This is the strongest candidate for the current local development baseline. Its schema is ahead of its migration history: the init migration cannot produce its current 31-table schema.

### `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db` — archived current-schema snapshot

- **Tables:** The same 30 application tables as the current schema except `LiveChatMessage`, plus `_prisma_migrations`.
- **Missing table:** `LiveChatMessage`.
- **Missing indexes:** `LiveChatMessage_liveSessionId_createdAt_idx` and `LiveChatMessage_userId_createdAt_idx`.
- **Missing foreign keys:** `LiveChatMessage.liveSessionId → LiveSession.id` and `LiveChatMessage.userId → User.id`, both cascade-delete relations.
- **Other columns/indexes/FKs:** Prisma's schema diff proposed only the missing chat table and its two indexes; no other schema difference was reported.
- **Row counts:** `User=4`, `Video=1`, `Like=1`; all other existing application tables have zero rows. `_prisma_migrations` has one row.
- **Migration history:** Exactly one successful `20260915022555_init` entry, no rollback, one applied step.
- **Assessment:** Near-current schema baseline, but migration history still does not record the schema expansion that added the other 23 tables beyond the init migration.

### `BACKEND/prisma/dev-backup.db` — legacy backend backup

- **Tables:** `User`, `Video`, `Like`, `Comment`, `Follow`, `Notification`, `Message`, plus `_prisma_migrations`.
- **Row counts:** `User=1`, `Video=1`, `Like=1`, `Comment=1`; `Follow`, `Notification`, and `Message` have zero rows. `_prisma_migrations` has one row.
- **Migration history:** Exactly one successful `20260915022555_init` entry, no rollback, one applied step.
- **Column metadata:**
  - `User`: `id`, `username`, `email`, `passwordHash`, nullable `displayName`, nullable `avatarUrl`, nullable `bio`, `createdAt`. It lacks current fields `phone`, account-role/verification/block flags, `creatorLevel`, and `updatedAt`. In this snapshot, the aggregate null count for `displayName` is zero.
  - `Video`: `id`, `userId`, required `caption`, `videoUrl`, required `soundTitle`, `createdAt`. It lacks current `views`, `shares`, `isPublic`, and `updatedAt`; current schema makes `caption` and `soundTitle` nullable.
  - `Comment`: `id`, `userId`, `videoId`, `text`, `createdAt`; lacks current required `updatedAt`.
  - `Like`: `id`, `userId`, `videoId`, `createdAt`.
  - `Follow`: `id`, `followerId`, `followingId`, `createdAt`.
  - `Notification`: `id`, `userId`, `type`, `message`, `read`, `createdAt`; current schema has required `title`, `message`, and `isRead` instead of `read`.
  - `Message`: `id`, `senderId`, `receiverId`, required `text`, `createdAt`; current schema adds nullable `conversationId`, `messageType`, nullable `mediaUrl`, and `isRead`, and makes `text` nullable.
- **Indexes:** Username/email unique indexes and Follow unique index exist. The Like unique index is on `(userId, videoId)` named `Like_userId_videoId_key`; current schema expects `(videoId, userId)` and Prisma diff drops/recreates that index. Other current model indexes are absent, including indexes on Message fields and all indexes for missing models.
- **Foreign keys:** Existing FKs are Comment→User/Video, Follow→User in both directions, Like→User/Video, Notification→User, Message→sender/receiver User, and Video→User; these use cascade deletes. No Conversation FK exists because the Conversation tables/field do not exist. Relations for all missing models are absent.
- **Missing model tables:** 24: `AffiliateClick`, `AffiliateCommission`, `AffiliateLink`, `AffiliateProfile`, `Conversation`, `ConversationMember`, `CreatorProfile`, `Game`, `GameScore`, `Gift`, `GiftTransaction`, `LiveChatMessage`, `LiveSession`, `LiveViewer`, `Order`, `OrderItem`, `Product`, `ProductReview`, `SecurityEvent`, `SecuritySession`, `SellerRating`, `Store`, `Wallet`, and `WalletTransaction`.

### `BACKUP-PRODUCTION-20261003-215229/prisma/dev-backup.db`

- **Tables, columns, indexes, foreign keys, and row counts:** Same legacy schema family and aggregate counts as `BACKEND/prisma/dev-backup.db`: the seven initial application tables plus migration ledger; `User=1`, `Video=1`, `Like=1`, `Comment=1`; other application tables empty.
- **Migration history:** One successful `20260915022555_init` record, no rollback, one applied step.
- **Diff result:** Same class of Prisma diff as the backend sibling legacy backup: missing 24 current model tables, existing table rebuilds/column changes, and missing current indexes.

## Prisma migration history differences

All four `_prisma_migrations` tables contain one row with:

- `migration_name = 20260915022555_init`
- `finished_at` present
- `rolled_back_at` absent
- `applied_steps_count = 1`

Thus the initial migration appears to have been applied in all four databases. However, the same ledger row appears in databases with three different physical schema states: seven legacy tables, 30 current tables, and 31 current tables. Migration history therefore does not explain the actual schema progression. Likely explanations include local schema synchronization outside migration history (for example, `db push`), restored/copied databases with incomplete migration bookkeeping, or schema files that evolved without committed migrations. The inventory cannot determine which mechanism occurred.

On a new empty database, `prisma migrate deploy` using only the checked-in history would apply the init SQL and create the seven-table legacy schema. It would not create the current schema because no later migration is checked in. On the main local DB, the physical schema is current even though the ledger contains no later migration entries.

## Schema diff against current Prisma model

| Baseline | Prisma diff result | Main difference |
|---|---|---|
| `BACKEND/prisma/dev.db` | Empty migration | Exact match to current `schema.prisma` |
| `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db` | Additive create operations | Missing `LiveChatMessage`, its two indexes, and two FKs |
| `BACKEND/prisma/dev-backup.db` | Large create/rebuild/index diff | Missing 24 models; rebuilds legacy Comment, Message, Notification, User, and Video; Like unique index order/name changes |
| `BACKUP-PRODUCTION-20261003-215229/prisma/dev-backup.db` | Same large diff family | Same legacy shape as backend sibling backup |

### Potentially dangerous schema changes

- **Required timestamps without backfill:** Current `User`, `Comment`, and `Video` each require `updatedAt`. The schema-only diff for legacy files rebuilds these tables and copies old columns without supplying `updatedAt`. The two legacy files each contain one row in each of those tables. A direct execution of that generated rebuild is likely to fail on the new NOT NULL fields unless SQL explicitly supplies a safe timestamp/default/backfill.
- **Required notification title:** Legacy `Notification` has `read` and no `title`; current schema requires `title` and renames the read-state field to `isRead`. The proposed table copy does not supply `title`. Current snapshots have zero Notification rows, but a populated deployed baseline could fail the rebuild or require a defined title backfill.
- **Nullable `displayName` becomes required:** Legacy User permits null; current schema does not. The inspected legacy snapshots have zero null `displayName` values, but other databases may not. Validate all target DBs before constraining the column.
- **Like unique index replacement:** Legacy unique index order/name is `(userId, videoId)`; current is `(videoId, userId)`. Both enforce the same pair uniqueness, but Prisma emits a drop/recreate. Confirm no duplicates and test query/index behavior before release.
- **SQLite table rebuilds:** Rebuilding tables can affect indexes, foreign keys, triggers, and data. Review generated SQL, check foreign-key integrity, and test with copies of each actual baseline. Do not apply an unreviewed `migrate diff` result.
- **New required fields/default behavior:** Current models add many non-null fields with defaults, and `@updatedAt` columns that may not have database defaults. Test generated insert/copy behavior against real row populations rather than assuming Prisma client defaults run during SQL migration.

## Likely supported database baselines

1. **Current local baseline:** `BACKEND/prisma/dev.db` is explicitly targeted by the local backend `.env` and physically matches the current schema. It is the best-supported local baseline, but its migration history is incomplete and cannot serve as proof of how a clean deployment gets there.
2. **Near-current backup baseline:** `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db` matches current schema except for the later `LiveChatMessage` model/table/indexes/FKs. It likely represents the schema immediately before chat was added.
3. **Legacy baseline:** Both `dev-backup.db` files have the original seven-table schema and the initial migration recorded. They are useful upgrade-test fixtures but are not current-schema databases.
4. **Unknown deployment baseline:** No production database URL or hosted database was inspected. Do not assume any local file is the production database or that the local migration ledger matches a hosted environment.

## Recommended migration strategy

1. **Identify the authoritative production baseline first.** Inventory each deployed database privately: provider, schema, `_prisma_migrations`, row counts/null counts for fields that will become required, and restore-tested backup status. Do not print or export user values in reports.
2. **Choose the canonical schema/provider.** Current schema is SQLite. If Stage 1 remains on SQLite, validate all local and deployed SQLite baselines. A move to PostgreSQL is a separate data migration and cutover plan.
3. **Preserve applied migration history.** Assume `20260915022555_init` has been applied because every inspected database records it successful. Do not edit or replace that migration. Add forward migrations for later schema changes. Establish a documented baseline procedure for any environment whose physical schema is ahead of its ledger.
4. **Split supported state transitions.** A clean database needs migrations that create the complete current schema. A legacy seven-table database needs additive tables plus carefully staged backfills/rebuilds. A 30-table database needs only the chat table/index/FKs. Do not presume one SQL script is safe for all three states.
5. **Backfill before enforcing required columns.** For `User.updatedAt`, `Comment.updatedAt`, `Video.updatedAt`, and `Notification.title`, define deterministic backfill values/logic, populate nullable columns first where needed, validate no unresolved nulls, then apply NOT NULL constraints. Preserve row identifiers and relation keys.
6. **Test on disposable copies.** Test clean migration from empty DB and upgrade paths from copies of the legacy and near-current databases. Check row counts, null aggregates, indexes, foreign keys, and `PRAGMA foreign_key_check`; verify data invariants without dumping row contents.
7. **Use deploy migrations only after review.** Do not use `prisma db push` as the production migration process. Do not run `migrate dev`, `migrate reset`, or apply anything until a reviewed migration is approved and backed up.
8. **Back up and deploy with rollback readiness.** Produce a restorable backup, run the reviewed migration in staging, validate app queries, then schedule production. Prefer additive/forward-compatible migrations. If rollback is needed after structural changes, restore a verified backup or ship a corrective forward migration; do not assume a destructive down migration is safe.
9. **Protect tracked backup artifacts.** Review the two tracked archived DBs using controlled read-only tooling. If they contain data not intended for source control, coordinate untracking and add ignore rules while retaining approved secure backups. Removing files from the latest commit does not remove them from Git history; history cleanup/force push needs a separately approved coordinated plan.

## Readiness conclusion

- **Main local DB:** `BACKEND/prisma/dev.db`; it is configured by backend `.env` and exactly matches current `schema.prisma`.
- **Backup DBs:** `BACKEND/prisma/dev-backup.db`; `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db`; `BACKUP-PRODUCTION-20261003-215229/prisma/dev-backup.db`.
- **Initial migration:** Appears applied in all four DBs according to successful, non-rolled-back ledger entries. The physical schema of two DBs is far ahead of that ledger.
- **Biggest schema differences:** The sole init migration only describes seven legacy tables; two legacy backups lack 24 current models and need existing-table rebuilds; the archived current DB lacks `LiveChatMessage`; required timestamp/title backfills and nullable-to-required constraints need care.
- **Safe to generate an additive migration now?** **No—not as a single migration for all databases.** The current local DB needs no schema diff; the near-current archive needs the chat addition; legacy baselines need table/column reconciliation with tested backfills, and a clean install needs the full migration chain. First identify supported/deployed baselines and resolve the dangerous rebuild/backfill cases.

## Metadata-only handling notes

No row values were selected. The inspection queried SQLite catalog/PRAGMA metadata, aggregate `COUNT(*)` values, null counts for migration-sensitive columns, and safe `_prisma_migrations` fields only (`migration_name`, finished/rollback presence, and applied step count). Migration `logs`, hashes, password hashes, tokens, user names, emails, and message contents were not queried or included. No database or migration file was changed.
