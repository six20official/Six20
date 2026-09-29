# HowFar Backend

Backend API for the HowFar Next.js frontend.

## Requirements
- Node.js 20+
- npm

## Setup

```bash
cd ayo-nija-backend
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The API runs on:

http://localhost:4000

Health check:

http://localhost:4000/api/health

Your Next.js frontend remains on:

http://localhost:3000

## Authentication

Register:

POST /api/auth/register

```json
{
  "username": "ayo",
  "email": "ayo@example.com",
  "password": "password123",
  "displayName": "Ayo"
}
```

Login:

POST /api/auth/login

Use the returned JWT in:

Authorization: Bearer YOUR_TOKEN

## Video upload

POST /api/videos

Content-Type: multipart/form-data

Fields:
- video: video file
- caption: text
- soundTitle: text

The uploaded video is served from `/uploads/...`.

## Connecting the frontend

Use:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
```

Then fetch:

```ts
const res = await fetch(`${API_URL}/api/videos`);
const videos = await res.json();
```

For protected requests:

```ts
fetch(`${API_URL}/api/videos/${id}/like`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

## Production note

For production, replace SQLite/local uploads with PostgreSQL and object storage such as S3-compatible storage, use a strong JWT secret, HTTPS, rate limiting, validation, and a reverse proxy.
