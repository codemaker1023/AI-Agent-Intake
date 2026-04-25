# AI Intake Agent

AI-powered intake app with voice webhook support and a simple dashboard for managing bots and call logs.

## Features

- AI intake conversations
- Voice webhook flow (pre-call and post-call)
- Bot management API
- Call log tracking
- Supabase-backed data storage

## Quick Start

### Requirements

- Node.js 18+
- npm
- Supabase project

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
3. Add required values in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   WEBHOOK_SECRET=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Run database schema:
   ```bash
   npx supabase db push
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000`

## API Endpoints

- `GET /api/bots`
- `POST /api/bots`
- `GET /api/bots/[id]`
- `PUT /api/bots/[id]`
- `DELETE /api/bots/[id]`
- `GET /api/call-logs`
- `POST /api/webhooks/pre-call`
- `POST /api/webhooks/post-call`
- `POST /api/functions/fetch-patient`

## Deploy

```bash
npm run build
npm start
```

Webhook URLs:

- `https://your-domain.com/api/webhooks/pre-call`
- `https://your-domain.com/api/webhooks/post-call`
