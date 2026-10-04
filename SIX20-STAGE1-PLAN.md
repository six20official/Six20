# SIX20 Stage 1 Implementation Plan

**Status:** Planning only; no implementation performed.  
**Scope:** The eight Stage 1 items requested: schema/migrations, LIVE route order, authenticated-user field, LIVE ended status, JWT secret, gift administration, frontend/backend environment configuration, and review of tracked database backups/artifacts.  
**Constraints respected:** No application or existing project files were changed; no package installation, migration, commit, or push was performed.

## Stage 1 goals and completion criteria

Stage 1 is complete when:

1. A clean database can be created from committed Prisma migrations and an existing supported database can be upgraded without data loss.
2. LIVE chat and like routes are registered before Express fallthrough handlers; chat uses the same authenticated-user field as middleware and consistently recognizes `ended` sessions.
3. The backend refuses to start without an explicitly configured secure JWT secret; production cannot fall back to a known value.
4. Gift creation requires an authenticated administrator, while public gift reads and normal authenticated gift sending continue to work.
5. Frontend examples consistently point to the backend URL, the wrongly named tracked environment file is no longer tracked, and ignored local configuration remains local.
6. Tracked database artifacts have been reviewed safely, removed from Git tracking where appropriate, and covered by ignore rules. Any actual sensitive exposure receives separate incident handling.

## 1. Exact files and planned changes

### Prisma schema and migrations

| File | Planned change |
|---|---|
| `BACKEND/prisma/schema.prisma` | Treat as the desired canonical model. Review it against the application queries, defaults, nullability, indexes, relations, and the actual target database before generating a migration. Change the schema only where the intended data contract needs correction. |
| `BACKEND/prisma/migrations/20260915022555_init/migration.sql` | **Do not edit if it has been applied anywhere.** Preserve its history/checksum. Only consider replacing it in a pre-release branch if evidence confirms it was never applied, no database depends on it, and the change is coordinated. Default plan is an additive forward migration. |
| `BACKEND/prisma/migrations/<timestamp>_reconcile_schema/migration.sql` | Add a new reviewed migration (or a small sequence of migrations) to bring known deployed schemas to the canonical schema. It must account for current differences such as missing models/columns and older nullability/column names. Preserve existing rows and use safe defaults/backfills for newly required fields. |
| `BACKEND/prisma/migrations/migration_lock.toml` | Change only if the database provider is intentionally changed. Current schema and lock use SQLite; a SQLite-to-PostgreSQL move is a separate data migration and not a provider-string-only edit. |
| `BACKEND/package.json` | No change expected for this step. Existing Prisma scripts can be used in the later implementation/verification work; do not run them during planning. |

The checked-in initial migration creates only older core tables and does not create the current LIVE, wallet, gift, game, security, and other schema models. It also differs in existing fields: for example, migration `User.displayName` is nullable while the schema requires it, migration `Video.caption` is required while the schema permits null, and the migration’s `Notification` columns differ from current schema fields. The exact diff must be generated and reviewed against each real database before writing SQL.

### LIVE route order, auth field, and status

| File | Planned change |
|---|---|
| `BACKEND/src/server.ts` | Register `registerLiveProductionRoutes(app, prisma, requireAuth)` after normal route declarations but **before** the 404 and error middleware. Keep a single registration. Ensure it is also registered before `startServer()` begins listening. Do not leave registration appended after the fallback handlers. |
| `BACKEND/src/live-production.ts` | Use the backend’s canonical authenticated request field (`userId`) consistently. Safely reject a missing/invalid user ID rather than dereferencing `req.user!.id`. Use the same lowercase LIVE state values used by `server.ts` (`scheduled`, `live`, `ended`) in validation. Validate the LIVE ID and session state on the like endpoint as well as chat. |
| `BACKEND/src/server.ts` | Keep the lifecycle status values consistent across create/list/start/end/join/leave and any comparisons. Do not introduce a different casing in route-specific checks. |

The current middleware writes `req.userId`; chat reads `req.user!.id`. Current lifecycle writes lowercase `ended`, while chat checks uppercase `ENDED`. These are runtime defects even though the existing backend typecheck passes.

### JWT secret handling

| File | Planned change |
|---|---|
| `BACKEND/src/server.ts` | Remove the fallback `six20-development-secret`. Read `JWT_SECRET` as required configuration and validate it before accepting requests/listening. Fail startup with a clear, non-secret-bearing message when absent or below the chosen strength policy. Keep the secret out of logs and responses. |
| `BACKEND/.env.example` | Replace the deployable-looking placeholder with explicit instructions that each environment must supply a unique, randomly generated secret. Do not commit a real secret. If retaining a placeholder, ensure it cannot be mistaken for a valid production value. |
| `BACKEND/README.md` | Document local secret generation, required startup configuration, secret rotation implications, and that deployment platforms must set `JWT_SECRET` separately. |
| Deployment environment settings (not tracked files) | Before deploying code that fails closed, provision a high-entropy secret in local development/staging/production. Do not reuse one secret across environments. Rotation will invalidate outstanding JWTs unless a planned transition mechanism is used. |

### Gift administration

| File | Planned change |
|---|---|
| `BACKEND/src/server.ts` | Protect `POST /api/gifts` with `requireAuth` and verify the authenticated database user has `isAdmin === true`. Return 401 when unauthenticated and 403 for non-admins. Keep `GET /api/gifts` and category/detail reads public if that is the intended product behavior. Ensure no public profile/update route can set `isAdmin`. |
| `BACKEND/prisma/schema.prisma` | Use the existing `User.isAdmin` field unless review finds a role model is required. Do not add a self-service admin privilege path. |
| `BACKEND/README.md` | Document the controlled admin provisioning/seed procedure and remove any implication that the public create route is a safe production seeding mechanism. |

Confirm how the first admin is created before enabling the guard. Provisioning should be an out-of-band controlled operation; do not make a public endpoint that grants admin status.

### Frontend/backend environment configuration

| File | Planned change |
|---|---|
| `FRONTEND/.env.local.example` | Set `NEXT_PUBLIC_API_URL` to the backend local origin (`http://localhost:4000`) and explain that this variable is the backend origin, not the Next.js frontend origin. |
| `FRONTEND/.env.example` | Align the value and documentation with the actual direct-backend calls in `FRONTEND/lib/api.ts`, FYP, discover, and create. Do not describe blank as same-origin unless every required API is actually proxied by Next.js. |
| `FRONTEND/README.md` | Document copying the example to the correctly named `.env.local`, local backend URL, and the separate production frontend/backend URLs and CORS configuration. |
| `FRONTEND/lib/api.ts` | Review the localhost default. Either retain it as a development-only fallback with a clear failure in production, or make the URL explicitly required for deployed builds. Do not change to the frontend origin unless the entire API surface is proxied. |
| `FRONTEND/env.local` | This wrongly named file is tracked and is not the standard Next.js env filename. After confirming it contains no value needed by a deployment, remove it from Git tracking while preserving any local working copy as appropriate. Do not copy its contents into a committed secret file. |
| `.gitignore` | Add a rule for the wrongly named `env.local` pattern (and any environment-specific local files confirmed during inventory). Preserve intended tracking of `.env.example` templates. |

The tracked `FRONTEND/env.local` is not loaded by Next.js as `.env.local`. The current `.env.local.example` points to `localhost:3000`, which is the frontend itself, while the helper and proxy handlers use the value as a backend origin. Correcting this is important to avoid requests hitting the wrong service or recursively proxying to the frontend.

### Tracked database backups and other artifacts

| File/path | Planned action |
|---|---|
| `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db` | Review locally in read-only mode for schema, user/media records, credentials, tokens, and other sensitive data. Do not place extracted values in this plan or logs. If unnecessary for source control, remove from the Git index while retaining a controlled local copy only if required. |
| `BACKUP-PRODUCTION-20261003-215229/prisma/dev-backup.db` | Same review and handling as `dev.db`; determine whether it is redundant or an authoritative recovery snapshot before untracking. |
| `BACKUP-PRODUCTION-20261003-215229/prisma/schema.prisma` and `.../migrations/**` | Confirm these are historical snapshots, not deployment sources. Avoid accidentally applying them as current production schema. |
| `BACKUP-PRODUCTION-20261003-215229/backend-src/server.ts` and `.../frontend-app/**`, `.../frontend-lib/**` | Treat as duplicate historical source. Check for embedded credentials or user data before retaining; clarify that these are backups rather than active code. |
| `.gitignore` | Add explicit rules for backup SQLite files/directories if the repository should not track them. Ensure rules do not hide legitimate migration SQL or source files. |

If review finds actual credentials or personal data, first restrict access and rotate/revoke exposed credentials. Removing a file from the latest commit does not erase it from Git history. Any history rewrite or force push requires a separate approved, coordinated action; it is not part of this plan.

## 2. Database migration strategy

1. **Inventory without writing:** Identify all environments and database URLs without publishing values. For each database, record provider/version, backup status, `_prisma_migrations` rows, actual tables/columns/indexes, and whether the existing init migration was applied. Inspect backup databases read-only and compare their schema/data shape.
2. **Choose the canonical schema:** Review `schema.prisma` against active backend queries and product requirements. Decide nullability/defaults and whether SQLite remains the Stage 1 target. Do not silently switch to PostgreSQL as part of a schema reconciliation.
3. **Preserve migration history:** Assume the existing init migration may already be applied. Do not edit it or alter its checksum. Produce a forward migration for each supported baseline; if existing environments have materially different schemas, explicitly document/baseline them rather than pretending one SQL file upgrades every state.
4. **Generate and review SQL:** Use Prisma migration-diff tooling against disposable/shadow copies after implementation starts. Inspect every `DROP`, table rebuild, rename, default, and data-copy step. Prefer additive columns/tables and explicit backfills; preserve rows and foreign-key relationships. Add constraints only after data is validated.
5. **Prove clean install and upgrade:** Apply the migration chain to a disposable empty database and separately upgrade a copy of each supported current database. Compare row counts and key invariants before/after; test every model used by auth, videos, LIVE, gifts, and wallet.
6. **Deploy safely:** Take a verified restorable backup, deploy compatible code, apply the reviewed migration using production deployment tooling (`migrate deploy`, not `db push`), then verify health and critical read/write operations. Avoid running `migrate dev`, `db push`, or reset against production.
7. **Stage 1 boundary:** This plan does not change providers or design a destructive data migration. SQLite-to-PostgreSQL, if selected, needs a separate export/import, validation, cutover, and rollback plan.

The root upgrade scripts call `prisma db push`; do not use either script as the production schema migration process. One script also has schema text-replacement risks. They make broad source edits, create backups, and run builds, so review/fix them separately before any future execution.

## 3. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Existing databases differ from the checked-in migration | Inventory each target and migration history; create/validate a forward path per supported baseline. Never assume the backup DB, local DB, and deployed DB match. |
| Data loss from SQLite table rebuilds or changed nullability | Back up and restore-test first; test on a copy; stage explicit backfills and constraints; compare counts and representative records. |
| Prisma migration history checksum mismatch | Do not rewrite an applied migration. Add forward migrations and reconcile/baseline only with a documented environment-specific procedure. |
| JWT fallback removal prevents startup | Provision valid secrets before rollout; test missing/weak-secret failure in staging; ensure local `.env` is configured without committing it. Token secret changes invalidate old tokens. |
| Gift guard blocks internal catalog maintenance | Identify and provision the initial admin via controlled access before rollout; test admin and non-admin paths. Keep public GET behavior separate. |
| LIVE route move changes previously 404 behavior | Add focused API integration checks for successful and rejected cases before release; ensure no duplicate route mounts. |
| Environment correction points requests to the wrong origin | Test from both the browser and Next server context; verify CORS and that each API call reaches BACKEND rather than FRONTEND. |
| Removing tracked backups breaks recovery | Verify a separate encrypted, access-controlled, restorable backup first. Untrack without deleting local copy when needed. |
| Sensitive data is present in current Git history | Restrict access and rotate secrets immediately; assess coordinated history cleanup separately. `git rm --cached` alone does not purge history. |

## 4. Testing and verification steps (for implementation phase)

These are planned checks only; none were run for this plan.

### Prisma/database

- Run Prisma schema validation and generate a migration diff from the canonical schema; review SQL manually.
- Apply the full migration chain to an empty disposable SQLite database.
- Apply the forward migration to a copy of each supported existing database; compare table/column/index state, row counts, and foreign-key integrity.
- Exercise representative CRUD paths for users, videos, LIVE sessions/viewers/chat, gifts, wallets, and wallet transactions.
- Confirm no data reset, destructive migration, or `db push` is part of release procedure.

### LIVE route/auth/status

- Start the backend against the migrated disposable database and confirm LIVE chat/like handlers are registered before the 404 middleware.
- Confirm unauthenticated chat POST/like requests return 401; authenticated chat stores the authenticated user's `userId`.
- Test scheduled → live → ended transitions; verify chat is rejected after end using the canonical lowercase state.
- Test nonexistent IDs, malformed IDs, and requests to unrelated paths to confirm correct 400/404 responses.

### Gift administration and JWT

- Confirm backend refuses to start with missing/weak `JWT_SECRET` and starts with a valid configured secret; ensure it never logs the secret.
- Confirm gift creation returns 401 without a token, 403 for a non-admin, and succeeds only for an admin.
- Confirm no profile or user route allows a normal user to change `isAdmin`.
- Verify normal public gift listing and authenticated gift sending continue to work against migrated data.

### Environment and repository artifacts

- Copy the frontend example to `.env.local` in a local test checkout and verify requests target `localhost:4000`.
- Verify production frontend/backend origins, API URL, and CORS allow the intended deployment and reject unintended origins.
- Confirm local env files are ignored and example templates remain tracked.
- Review backup databases in read-only mode; check `git ls-files` and ignore behavior after artifact cleanup. Scan tracked files/history for credentials without printing secrets.

### Build and release checks

- Run backend and frontend TypeScript checks, backend build, frontend production build, and configured lint after implementation.
- Run integration tests against a disposable database; do not use production data for test writes.
- Perform a staging deployment and smoke-test health, auth, migration state, LIVE routes, and gift authorization before production rollout.

## 5. Rollback strategy

### Application code

- Release the route-order, auth-field, status, JWT, and gift-guard fixes as a reviewed code version. If a regression occurs, roll application code back to the last known version only when it remains compatible with the already-applied additive migration.
- Prefer forward-compatible migrations so old code can run during rollback. Do not automatically execute a destructive “down” migration.
- If migration compatibility cannot be guaranteed, stop rollout and restore the verified database backup using the agreed recovery procedure. Confirm recovery against the same provider/version and validate records before reopening traffic.

### Secrets and access control

- Set the new required JWT secret in the deployment environment before deploying code that requires it. Keep the value in the secret manager; never commit it.
- If secret rotation invalidates active sessions, communicate the expected re-login behavior and plan the rotation window. Do not restore the known development fallback as a rollback.
- If gift admin checks block a legitimate operator, fix/provision the admin path; do not temporarily reopen an unauthenticated public write endpoint.

### Environment and tracked artifacts

- Revert template/documentation changes through version control if they misdirect a deployment, while retaining correct deployment-specific secret values outside Git.
- For backup files, keep a verified secure recovery copy before untracking. Restoring Git tracking should require a sensitivity review first.
- If a credential or user-data exposure is confirmed, rotation/revocation and access restriction take priority. Git-history cleanup is a separate coordinated operation; it may require force-push and collaborator synchronization, so it is not an automatic rollback step.

## 6. Recommended order of execution

1. **Inventory and protect state:** Identify deployment environments, current DB provider/schema/migration history, backup restoreability, active JWT configuration, gift admin provisioning, and artifact sensitivity. No code edits until the target states are known.
2. **Set migration baseline and canonical schema:** Decide supported DB states and SQLite/PostgreSQL scope. Preserve applied migration history; draft additive migration SQL and validate on disposable copies.
3. **Implement and test migration:** Add reviewed forward migration(s), test fresh database creation and existing database upgrades, and confirm data invariants.
4. **Harden JWT configuration:** Provision valid secrets in all environments, then remove fallback and validate startup failure/success in staging.
5. **Protect gift administration:** Add auth plus database-backed admin authorization; verify controlled initial admin provisioning and non-admin rejection.
6. **Fix LIVE routes and contracts:** Move route registration before fallback middleware and server listen; standardize `req.userId`; standardize `scheduled`/`live`/`ended`; run integration checks.
7. **Correct environment files and docs:** Align frontend examples with backend URL, explain frontend/backend origins and CORS, and stop tracking the wrongly named `FRONTEND/env.local` while preserving local config as appropriate.
8. **Review/untrack sensitive artifacts:** Read-only review DB snapshots and historical artifacts, verify external secure backups, add ignore rules, and untrack files that should not be in source control. Escalate any history cleanup separately.
9. **Release through staging:** Run TypeScript, build, lint, migration, API integration, and environment smoke checks; stage deploy and verify health/data/access controls.
10. **Production rollout and observation:** Take a verified backup, deploy compatible code, apply the reviewed migration, smoke-test critical endpoints, monitor errors, and retain the documented rollback path.

## 7. Files in scope summary

**Expected application/configuration edits during implementation:**

- `BACKEND/prisma/schema.prisma` (only if canonical model corrections are needed)
- `BACKEND/prisma/migrations/<timestamp>_reconcile_schema/migration.sql` (new forward migration)
- `BACKEND/src/server.ts`
- `BACKEND/src/live-production.ts`
- `BACKEND/.env.example`
- `BACKEND/README.md`
- `FRONTEND/.env.example`
- `FRONTEND/.env.local.example`
- `FRONTEND/README.md`
- `FRONTEND/lib/api.ts` (only if production URL validation/default policy is changed)
- `.gitignore`
- `FRONTEND/env.local` (remove from Git tracking; retain local copy only if needed)

**Tracked artifacts to review and potentially untrack, not erase without approval:**

- `BACKUP-PRODUCTION-20261003-215229/prisma/dev.db`
- `BACKUP-PRODUCTION-20261003-215229/prisma/dev-backup.db`
- `BACKUP-PRODUCTION-20261003-215229/prisma/schema.prisma`
- `BACKUP-PRODUCTION-20261003-215229/prisma/migrations/20260915022555_init/migration.sql`
- `BACKUP-PRODUCTION-20261003-215229/backend-src/server.ts`
- `BACKUP-PRODUCTION-20261003-215229/frontend-app/**`
- `BACKUP-PRODUCTION-20261003-215229/frontend-lib/**`

The audit document `SIX20-AUDIT.md` is reference material and is not an implementation target for Stage 1.

STAGE 1 PLAN COMPLETE
C:\Users\USER\Desktop\six20\SIX20-STAGE1-PLAN.md
