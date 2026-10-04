# SIX20 Engineering Audit

**Review type:** Read-only engineering audit  
**Repository:** `six20`  
**Branch:** `main`  
**Audit scope:** Tracked project structure and source/configuration in `FRONTEND`, `BACKEND`, backup snapshot, and root PowerShell scripts.

No existing project files were modified, deleted, installed, committed, or pushed for this audit. Frontend and backend TypeScript no-emit checks completed successfully. Tests and production builds were not run.

## 1. Project structure

- ✅ **WORKING** — One Git repository contains the `FRONTEND` Next.js app and `BACKEND` Express/Prisma service.
- ⚠️ **PARTIAL** — `FRONTEND` has App Router pages, API route handlers, shared components, API helpers, and demo store. `BACKEND` has the Express server, Prisma schema, and one migration.
- ⚠️ **PARTIAL** — The root contains `SIX20-PRODUCTION-UPGRADE.ps1` and `SIX20-PRODUCTION-UPGRADE-CLEAN.ps1`. Both scripts overwrite application/schema files and run Prisma/build commands; they are operational scripts, not read-only checks. The “CLEAN” script uses single-quoted PowerShell replacement strings containing backticks, which risks inserting literal escape text into the schema.
- ⚠️ **PARTIAL** — A tracked `BACKUP-PRODUCTION-20261003-215229` contains source snapshots and SQLite database files. The database contents were not inspected; committed DB snapshots can expose persisted data and should be handled as sensitive artifacts.
- ❌ **NOT IMPLEMENTED** — No project-level deployment manifest, CI workflow, or automated release configuration was found.

## 2. Frontend

- ⚠️ **PARTIAL** — `FRONTEND/app` provides routes for home, FYP, discover, create, profile, LIVE, wallet, games, messages, marketplace, and notifications.
- ⚠️ **PARTIAL** — Home/auth, profile, create, feed, and discover include backend calls. Some UI routes remain sample-data experiences, and several Next.js API handlers use a separate in-memory store in `FRONTEND/lib/store.ts`.
- ⚠️ **PARTIAL** — The in-memory store is process-local and resets on restart. It also has a hard-coded demo creator and sample posts. This makes it unsuitable as persistent multi-user production data.
- ✅ **WORKING** — Frontend TypeScript no-emit check passed.
- ⚠️ **PARTIAL** — The package defines `next lint`, but does not declare ESLint in `package.json`; lint behavior was not run or verified. Production build was not run.

## 3. Backend

- ⚠️ **PARTIAL** — `BACKEND/src/server.ts` uses Express 5 and exposes health, auth, user/profile, upload, video, social, LIVE, gifts, and wallet routes.
- ⚠️ **PARTIAL** — Backend routes include database-backed operations, but availability depends on the actual database having the current Prisma schema. The checked-in migration does not provision all current models.
- ⚠️ **PARTIAL** — Uploads are written to local disk under `UPLOAD_DIR`; the endpoint accepts files up to 100 MB. Local disk is not durable shared storage for horizontally scaled/serverless deployment, and the upload flow needs production content validation and storage controls.
- ✅ **WORKING** — Backend TypeScript no-emit check passed.
- ⚠️ **PARTIAL** — `fastify` is declared as a dependency but the server code inspected uses Express.

## 4. LIVE

- ⚠️ **PARTIAL** — Backend has Prisma-backed session create/list/read/start/end/join/leave handlers in `BACKEND/src/server.ts`. These handlers update `LiveSession` and `LiveViewer` records when the required schema exists.
- ❌ **NOT IMPLEMENTED** — `FRONTEND/app/live/page.tsx` does not call a LIVE API or select a real session.
- ⚠️ **PARTIAL** — The database has session metadata, status, `streamKey`, `viewerCount`, and `likes` fields. `streamKey` is not connected to a media service.
- ❌ **NOT IMPLEMENTED** — Real creator ingest and viewer playback are absent; the UI shows a decorative gradient in place of a video player.
- ❌ **NOT IMPLEMENTED** — The LIVE page's room discovery, chat, gifts, likes, and Ludo are not integrated with backend state.

## 5. Authentication

- ⚠️ **PARTIAL** — Backend registration hashes passwords with bcrypt; login verifies the hash and returns a JWT. Protected routes use bearer-token middleware.
- ⚠️ **PARTIAL** — The backend enforces a six-character minimum password and issues tokens with a 30-day expiry. No rate limiting or broader abuse controls were found.
- ❌ **BROKEN** — `BACKEND/src/server.ts` falls back to the known string `six20-development-secret` when `JWT_SECRET` is absent. Production must fail closed when required secrets are missing.
- ⚠️ **PARTIAL** — Frontend stores the JWT in `localStorage`, which is accessible to injected JavaScript. The project README recommends secure HTTP-only sessions, but the current frontend uses local storage.
- ⚠️ **PARTIAL** — The API uses explicit `FRONTEND_URL` CORS configuration and defaults it to localhost; production origin configuration is required.

## 6. API connection

- ⚠️ **PARTIAL** — `FRONTEND/lib/api.ts` builds requests from `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:4000`; callers add bearer authorization where needed.
- ⚠️ **PARTIAL** — Some Next.js route handlers proxy auth/profile/upload requests to the backend, while pages such as FYP/discover/create call the backend directly. There is not one consistent API boundary.
- ⚠️ **PARTIAL** — Other Next.js API handlers (posts, likes, comments, follows) operate on the in-memory store rather than the Prisma service, so data can diverge between features.
- ⚠️ **PARTIAL** — API errors are converted to thrown errors by `apiFetch`, but error/loading behavior varies by page. Production URL, CORS, and frontend deployment origin must be configured together.

## 7. Prisma/database

- ❌ **BROKEN** — `BACKEND/prisma/schema.prisma` defines many models, including LIVE, wallet, gifts, games, messaging, security, store, and affiliate data. The only migration, `BACKEND/prisma/migrations/20260915022555_init/migration.sql`, creates only the older core tables (`User`, `Video`, `Like`, `Comment`, `Follow`, `Notification`, and `Message`). It also contains older column definitions. A clean deployment from checked-in migrations will lack schema required by current code.
- ⚠️ **PARTIAL** — Prisma datasource uses SQLite (`DATABASE_URL`). The backend README itself lists PostgreSQL as a production migration step.
- ⚠️ **PARTIAL** — `BACKEND/.env.example` points to a local SQLite file and a placeholder JWT secret; it is development configuration, not production-ready configuration.
- ⚠️ **PARTIAL** — Several database relations and transactional gift operations are modeled, but correctness in a production database cannot be established from the migration set as checked in.

## 8. Chat

- ❌ **BROKEN** — `registerLiveProductionRoutes` is called at the end of `BACKEND/src/server.ts`, after the Express catch-all 404 and error middleware. The `/api/live/:id/chat` and `/api/live/:id/like` handlers registered there are reached too late and are intercepted by the 404 middleware.
- ❌ **BROKEN** — If chat POST is made reachable, it reads `req.user!.id` in `BACKEND/src/live-production.ts`, but the auth middleware sets `req.userId` in `server.ts`.
- ❌ **BROKEN** — LIVE end stores lowercase `"ended"`; chat checks uppercase `"ENDED"`, so that guard does not recognize the stored state.
- ⚠️ **PARTIAL** — `LiveChatMessage` exists in the Prisma schema, but not in the checked-in migration.
- ❌ **NOT IMPLEMENTED** — The LIVE page renders fixed example messages and its send button has no handler. No socket/realtime transport or polling UI is present.
- ⚠️ **PARTIAL** — The backend chat GET/POST design is request/response only; production chat still needs realtime delivery, moderation, rate controls, and retention policy.

## 9. Viewer counts

- ⚠️ **PARTIAL** — Join upserts a user/session row and counts `LiveViewer` records; leave deletes the row and recalculates the count. This can represent database-recorded joins when those routes and tables are available.
- ⚠️ **PARTIAL** — A disconnect without a successful leave can leave stale records. There is no heartbeat, lease/expiry, or cleanup job; counts are therefore not a reliable count of currently connected viewers.
- ❌ **NOT IMPLEMENTED** — The displayed 12.8K and other viewer figures in the LIVE page are literal demo values and are not fetched from the backend.
- ⚠️ **PARTIAL** — Ending a live sets `viewerCount` to zero but does not clear all viewer rows, so later counts/cleanup may be inconsistent.

## 10. Likes

- ❌ **BROKEN** — The backend LIVE like route is registered after the 404 middleware and is unreachable.
- ⚠️ **PARTIAL** — Its handler would increment `LiveSession.likes`, but there is no per-user unique LIVE-like record, idempotency, or unlike behavior.
- ❌ **NOT IMPLEMENTED** — The LIVE heart only toggles React state; it does not save a like.
- ⚠️ **PARTIAL** — Video likes have a Prisma model/route, but other Next.js like routes use the in-memory store, creating different behavior across screens.

## 11. Gifts

- ⚠️ **PARTIAL** — Backend has gift catalog read routes and a `Gift` model. Gift inventory population/administration needs a controlled process.
- ❌ **BROKEN** — `POST /api/gifts` is an unauthenticated catalog-creation route, exposing a production write operation to any caller.
- ⚠️ **PARTIAL** — Authenticated `POST /api/gifts/send` validates receiver, gift, quantity, optional live session, and sender balance, then records gift and wallet transactions transactionally.
- ❌ **NOT IMPLEMENTED** — LIVE's Gift button does not load inventory or call the send endpoint.
- ⚠️ **PARTIAL** — Gifting needs wallet funding, idempotency/concurrency safeguards, abuse controls, and a reconciled production database before handling value.

## 12. Wallet

- ⚠️ **PARTIAL** — Backend supports wallet reads, transaction history, and creator earnings; wallet and transaction models are present in the schema.
- ⚠️ **PARTIAL** — Gift sending debits coins and credits creator earnings in a database transaction.
- ❌ **NOT IMPLEMENTED** — No coin purchase/top-up payment flow or payout/withdrawal provider is implemented.
- ❌ **NOT IMPLEMENTED** — Frontend wallet balance and “Add 500 Coins” are local demo state; withdrawal explicitly reports that payment/payout integration is pending.
- ❌ **NOT IMPLEMENTED** — LIVE gifts do not connect to wallet APIs, and the current wallet UI does not show backend transactions.

## 13. Games/Ludo

- ❌ **NOT IMPLEMENTED** — LIVE's Ludo board is a decorative 64-cell grid; no turn, dice, move, win, or multiplayer logic exists.
- ⚠️ **PARTIAL** — `FRONTEND/app/games/page.tsx` contains a client-side trivia quiz and local score only.
- ❌ **NOT IMPLEMENTED** — Other game cards only show an alert. There is no Ludo backend/API connection or server-authoritative game state.
- ⚠️ **PARTIAL** — Prisma has `Game` and `GameScore` models, but no game routes were identified and the migration lacks these tables.

## 14. Video streaming

- ❌ **NOT IMPLEMENTED** — No streaming provider SDK/service, RTMP/WebRTC ingest, transcoding, playback URL, or viewer player was found in the app/backend code.
- ⚠️ **PARTIAL** — A `streamKey` column exists on `LiveSession`, but the application does not use it to provision or authenticate a stream.
- ⚠️ **PARTIAL** — The backend supports file uploads for videos, which is separate from live streaming. Uploads use local disk and have a 100 MB limit.

## 15. Environment variables

- ⚠️ **PARTIAL** — Backend variables are `PORT`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and `UPLOAD_DIR`; production values and required-variable validation are needed.
- ❌ **BROKEN** — Tracked `FRONTEND/env.local` is not the filename Next.js loads; Next expects `.env.local`. An ignored `.env.local` may exist locally, but it is not a tracked, reproducible deployment config.
- ⚠️ **PARTIAL** — `FRONTEND/lib/api.ts` defaults to localhost:4000. This is convenient locally but production must set `NEXT_PUBLIC_API_URL` at build/runtime as appropriate.
- ❌ **BROKEN** — `FRONTEND/.env.local.example` sets `NEXT_PUBLIC_API_URL` to `http://localhost:3000`, the frontend itself, while frontend helpers and proxy handlers use that value to contact the backend. That example would misroute backend calls.
- ⚠️ **PARTIAL** — `FRONTEND/.env.example` says blank means same-origin routes, but direct API calls use the localhost:4000 fallback; the documented behavior and code differ.

## 16. Git/GitHub

- ✅ **WORKING** — Repository remote is `https://github.com/six20official/Six20.git`; branch `main` tracks `origin/main`; working tree was clean before creating this audit document.
- ⚠️ **PARTIAL** — The tracked backup directory includes duplicated source and binary SQLite snapshots. Avoid distributing database files as source artifacts; assess their data sensitivity and repository history.
- ⚠️ **PARTIAL** — Root `.gitignore` excludes common `.env`, `.env.local`, `dist`, and logs, but does not prevent tracking `FRONTEND/env.local` or backup databases. Backend ignore excludes `.env`, uploads, and Prisma DB files, but committed backup files are outside those rules.
- ✅ **WORKING** — No GitHub Actions workflow or other CI configuration was found in the tracked project.

## 17. Vercel/deployment readiness

- ⚠️ **PARTIAL** — The frontend is a Next.js app that can be deployed as a Vercel project, but no `vercel.json` or deployment-specific setup was found.
- ❌ **NOT IMPLEMENTED** — The Express backend is a separate long-running service and needs its own deployment target, public API URL, CORS origin, database, and storage configuration.
- ⚠️ **PARTIAL** — Some API route handlers proxy to the backend, but other pages call the backend directly; production requires consistent URL and CORS configuration.
- ❌ **NOT IMPLEMENTED** — Local SQLite and local filesystem uploads are not durable deployment services and are unsuitable for typical serverless scaling.
- ⚠️ **PARTIAL** — Backend README suggests a separate service (for example Railway) but no deploy manifest, release automation, health-based rollout, or migration job is configured.

## 18. TypeScript/build errors

- ✅ **WORKING** — `tsc --noEmit` completed successfully for `FRONTEND` and `BACKEND` using the dependencies already present in the workspace.
- ⚠️ **PARTIAL** — No Next.js production build or backend runtime start was executed during this audit; successful type checking does not verify deployment behavior.
- ⚠️ **PARTIAL** — Prisma client types can compile while the actual database schema is stale; the missing migrations remain a runtime blocker.
- ⚠️ **PARTIAL** — The frontend `lint` script invokes `next lint`, but ESLint is not declared in its package manifest; the lint command was not run.
- ⚠️ **PARTIAL** — `SIX20-PRODUCTION-UPGRADE-CLEAN.ps1` replacement strings may inject literal backtick sequences into `schema.prisma`; do not treat that script as verified.

## 19. Security issues

- ❌ **BROKEN** — Known default JWT secret is accepted instead of requiring a production secret.
- ⚠️ **PARTIAL** — JWT in `localStorage` increases token exposure if frontend script injection occurs; use a safer session design and appropriate CSRF protections.
- ❌ **BROKEN** — Gift creation endpoint is unauthenticated.
- ⚠️ **PARTIAL** — No request rate limiting was found for auth, chat, likes, or gifts. Upload validation and abuse controls need review.
- ⚠️ **PARTIAL** — SQLite snapshots are checked into the repository. Their content was not examined, so treat them as potentially containing user data until reviewed.
- ⚠️ **PARTIAL** — Auth accepts six-character passwords; stronger password policy and abuse monitoring are needed.
- ⚠️ **PARTIAL** — Express CORS is restricted to one configured frontend origin, but deployment configuration must set the correct HTTPS origin.

## 20. Production blockers

- ❌ **BROKEN** — Prisma migration history is incomplete relative to the current schema.
- ❌ **BROKEN** — LIVE chat/like routes are registered after the Express fallback; chat also has auth-property and status-case mismatches.
- ❌ **NOT IMPLEMENTED** — Real LIVE video streaming, LIVE UI/API wiring, realtime chat, functional Ludo, coin funding, and payouts.
- ❌ **BROKEN** — Unauthenticated gift-catalog write route and insecure JWT fallback.
- ⚠️ **PARTIAL** — Viewer count lifecycle, likes idempotency, and gift/wallet value handling need production-grade controls.
- ⚠️ **PARTIAL** — Database, uploads, environment setup, Vercel/backend split deployment, monitoring, and backups need production design.
- ⚠️ **PARTIAL** — Tracked SQLite snapshots and source backups require data-sensitivity and repository hygiene review.

## A. What is working

- ✅ **WORKING** — Frontend and backend TypeScript no-emit checks pass.
- ⚠️ **PARTIAL** — Backend auth, video/social, LIVE session lifecycle, gift, and wallet API implementations exist.
- ✅ **WORKING** — Git repository and `main`/`origin` tracking are configured.

## B. What is fake/demo

- ❌ **NOT IMPLEMENTED** — LIVE room cards, stream display, viewer counts, chat history, search, room selection, likes, Gift and Share controls are demo UI.
- ❌ **NOT IMPLEMENTED** — LIVE Ludo grid and games beyond the local quiz.
- ❌ **NOT IMPLEMENTED** — Wallet balance/top-up and marketplace/message/notification content are local sample state.
- ⚠️ **PARTIAL** — Some Next.js social API routes persist only in process memory, not in the backend database.

## C. What is broken

- ❌ **BROKEN** — LIVE chat/like routes are mounted after Express fallback middleware.
- ❌ **BROKEN** — Chat reads an auth property the middleware does not set and compares a mismatched ended status.
- ❌ **BROKEN** — Current Prisma migrations do not provision the schema used by current routes.
- ❌ **BROKEN** — Frontend env examples/file naming are inconsistent; the `.env.local.example` backend URL points at the frontend itself.
- ❌ **BROKEN** — Gift catalog creation is not protected by authentication/admin authorization.

## D. What must be fixed first

1. ❌ **BROKEN** — Reconcile Prisma schema, migrations, and the chosen production database before deploying database-backed features.
2. ❌ **BROKEN** — Remove the JWT fallback, protect gift administration, and establish production auth/rate-limit controls.
3. ❌ **BROKEN** — Fix Express route registration and LIVE chat authentication/status handling.
4. ⚠️ **PARTIAL** — Choose streaming, persistent media storage, and viewer lifecycle architecture.
5. ⚠️ **PARTIAL** — Correct environment examples and configure frontend/backend origins and API URLs.

## E. Recommended implementation order

1. ⚠️ **PARTIAL** — Establish production database/storage architecture and create migrations matching the Prisma schema.
2. ⚠️ **PARTIAL** — Secure auth, secrets, gift administration, request validation, rate limiting, uploads, and monitoring.
3. ❌ **NOT IMPLEMENTED** — Select and integrate a video streaming provider for creator ingest and viewer playback.
4. ❌ **BROKEN** — Fix and verify LIVE API route order, auth typing, status handling, viewer cleanup, and per-user likes.
5. ❌ **NOT IMPLEMENTED** — Connect the LIVE page to real sessions, stream playback, chat, viewer counts, likes, and gift sending.
6. ❌ **NOT IMPLEMENTED** — Add wallet funding and payout provider flows, then connect wallet and gift interfaces.
7. ❌ **NOT IMPLEMENTED** — Implement multiplayer Ludo if it is a launch requirement; otherwise remove the inactive control.
8. ⚠️ **PARTIAL** — Consolidate frontend in-memory social routes with the Prisma backend and unify API access.
9. ⚠️ **PARTIAL** — Configure Vercel/frontend deployment and separate backend hosting, environment variables, persistent storage, CI, backups, and observability.
10. ⚠️ **PARTIAL** — Run migrations against a clean environment, production builds, and integration checks before release.
