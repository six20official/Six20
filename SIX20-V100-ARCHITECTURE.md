# SIX20 V100 Architecture Map

## Product direction

SIX20 is an African-born global entertainment platform: **Where Entertainment Comes Alive.** Build on the current application as a modular platform; do not replace working features or claim unfinished engines as live functionality.

## Current repository map

| Engine | Current foundation | Current gap |
| --- | --- | --- |
| Social | Prisma users, creator profiles, videos, follows, likes, comments, messages, notifications; Express routes and Next app pages | Some frontend API routes use an in-memory store; shares and recommendation signals are not durable product systems |
| LIVE | Express lifecycle and presence routes, Prisma chat/gift/moderation records, LiveKit server tokens and client stage, chat/reaction/gift room broadcasts | No durable battle, poll, co-host, goal, or game state; current polling and lifecycle race handling need further production hardening |
| PLAY | `Game` and `GameScore` models and a client trivia prototype | No server-authoritative lobbies, players, game state/events/results, anti-cheat, or LIVE launch integration |
| MUSIC | Shared video/sound metadata and discovery UI | No artist, track, playlist, or music rights/catalog domain |
| MARKET | Store, Product, Order, OrderItem, review, and affiliate models | No complete server-authoritative cart, checkout, payment, or commission settlement flow |
| EVENTS | No dedicated event or ticket models found | Events, ticket inventory, admission, refunds, and virtual/physical attendance are not implemented |
| ECONOMY | Integer-kobo wallet fields, Paystack funding/webhook/withdrawals, transfers, gifts, and transaction records | Paystack credentials are not present in the local environment; operational settlement/reconciliation and production-grade ledgering remain |
| REWARDS | Affiliate commission models and gift earnings | No unified, auditable rewards rules/ledger for watch, game, referral, creator, and event rewards |
| AI | Provider interface contracts in `BACKEND/src/providers/ai.ts` | No AI provider implementation is configured; no AI behavior is claimed |
| DISCOVERY | Video listing/search UI and existing social interactions | No persisted watch/search/category/location signal pipeline or recommendation ranking service |

## Target architecture

Start with a **modular monolith**. Keep the existing Next.js frontend and Express API, but group backend ownership by feature: `social`, `live`, `play`, `music`, `market`, `events`, `economy`, `rewards`, `ai`, and `discovery`. Modules share authentication, validation, observability, and database transaction utilities. Extract services only when traffic, operational ownership, or scaling needs justify them.

```text
Next.js web/mobile clients
        │ HTTPS + authenticated APIs
        ▼
Express modular API ── server-authoritative commands ── Prisma
        │                                                   │
        ├── LiveKit token/control APIs                      └── durable records and ledger
        ├── Paystack payment/transfer adapters
        └── provider interfaces (AI, media, notifications)
        │
        └── LiveKit realtime fanout (ephemeral; never the durable store)
```

SQLite remains suitable for local development. Before production scale, plan and rehearse a safe migration to a production database, use a durable job/outbox path for provider callbacks and broadcasts, and use shared rate-limit/presence infrastructure when running multiple API instances. Never reset or discard existing data during that transition.

## LIVE realtime contract

The API remains authoritative for permissions, validation, money, moderation, and durable history. LiveKit carries transient room events and participant state; a disconnected client can recover durable chat and gift history from the database.

Use a versioned event envelope with a stable event identifier, room/session identifier, event type/topic, actor identity, server timestamp, and validated payload. Namespaces include `chat.message`, `live.reaction`, `live.gift`, `live.presence`, `live.moderation`, `live.poll`, `live.battle`, `live.game`, and `live.cohost`.

- Chat: reliable room data after server validation and database persistence.
- Reactions and high-frequency game input: low-latency data; validate/rate-limit at the API or authoritative game host.
- Shared poll, battle, and game state: server-owned versioned state; publish snapshots/deltas for room participants.
- Request/response actions: authenticated server APIs or LiveKit RPC where the call is truly room-scoped.
- Durable history: database records and a transactional outbox; do not treat LiveKit packets as storage.

Client publish grants should be no broader than needed. Gift value, scores, votes, moderation actions, and balances must be derived or validated server-side.

## Economy and data boundaries

All monetary values are integer kobo. Wallet balance changes and matching ledger records are atomic and server-authoritative. Payment redirect parameters are never proof of payment; Paystack signatures and verification remain required. Reward, affiliate, marketplace, and event earnings should post typed ledger entries with unique idempotency keys rather than mutating balances from the client.

Recommendation inputs must be observed events (watch duration, likes, shares, follows, comments, gifts, games, searches, categories, and location with consent). Empty history stays empty; do not seed fabricated engagement, balance, audience, or ranking data.

## Delivery sequence

1. Audit and preserve existing data; keep migrations additive and inspect status before any migration.
2. Stabilize shared contracts, API validation, authentication, idempotency, observability, and transactional event/outbox patterns.
3. Harden the existing LiveKit LIVE path and add durable state machines for presence, moderation, polls, co-hosts, battles, and LIVE-launched games.
4. Build PLAY sessions/adapters and server-authoritative results.
5. Consolidate economy/rewards around a kobo ledger and reconciliation.
6. Add market checkout, events/tickets, and music catalog/licensing domains.
7. Configure AI providers behind the interfaces; unavailable providers return unavailable, never synthetic output.
8. Capture real discovery signals and rank from observed data.
9. Load-test, threat-model, instrument, and optimize client bundles, polling, and shared infrastructure.
