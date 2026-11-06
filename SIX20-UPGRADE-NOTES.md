# SIX20 Universal Entertainment Upgrade — November 4, 2026

## What changed

1. The root launch route (`FRONTEND/app/page.tsx`) now displays the existing SIX20 cinematic intro and automatically routes to `/fyp` when the intro completes.
2. The previous root landing/marketing page has been preserved at `/home` (`FRONTEND/app/home/page.tsx`). It has not been discarded.
3. The FYP now has a persistent responsive navigation dock for For You, Discover, Create, LIVE, and Profile.
4. FYP video captions and action controls have been lifted to remain clear of the new navigation dock.
5. App metadata now describes SIX20 as a universal entertainment platform.

## What was deliberately preserved

- Existing backend source and API contracts.
- Existing authentication, wallet, Paystack, database schema, and LIVE services.
- Existing FYP video loading, scrolling, playback, like, and share behavior.
- Existing modules and routes.

## Important safety note

This source package intentionally does not include `.env` files, local database files, database backups, `node_modules`, or generated `.next`/`dist` output. Keep your existing `.env` files and `BACKEND/prisma/dev.db` in place. Do not reset or replace your database.

## Verification

Frontend TypeScript check completed successfully with `tsc --noEmit`.
A full Next.js production build could not complete in this environment because the platform-specific Next.js SWC binary was not present and the environment could not download it. Run `npm.cmd run build` on your Windows development machine after extracting the update.
