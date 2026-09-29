# HowFar

A working Next.js starter based on the supplied HowFar UI.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Included

- Sign up / login / logout
- Token-based session for the demo
- Feed
- Likes
- Follow action
- Share/copy feedback
- Responsive desktop/mobile navigation
- Discover, Live, Messages, Notifications, Marketplace, Wallet, Games and Profile routes
- API routes for auth, current user, posts, likes, comments and follows

## Important production step

The included API store is intentionally an in-memory development backend. Restarting the server clears newly created users/posts. Before production, replace `lib/store.ts` with PostgreSQL/Supabase/Prisma (or another persistent database), hash passwords with Argon2/bcrypt, use secure HTTP-only sessions, add validation/rate limiting, and use object storage for media uploads.
