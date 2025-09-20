# 🤖 AI Intake Agent

[![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0.0-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

An intelligent, voice-powered medical intake system that revolutionizes patient interactions through AI-driven conversations. Built with Next.js, TypeScript, and Supabase for scalable, real-time healthcare solutions.

## ✨ Features

### 🎯 Core Capabilities
- **AI-Powered Conversations**: Intelligent bots handle patient intake with natural language processing
- **Voice Integration**: Seamless webhook-based voice call handling with Twilio
- **Patient Management**: Comprehensive patient database with medical ID tracking
- **Real-time Analytics**: Live call monitoring and detailed conversation logs
- **Multi-Domain Support**: Configurable for medical, legal, and receptionist use cases

### 🏗️ Architecture Highlights
- **Serverless API**: RESTful endpoints for bot management and webhook processing
- **Database Integration**: PostgreSQL via Supabase with real-time subscriptions
- **Security First**: Webhook signature validation and rate limiting
- **Monitoring**: Built-in performance tracking and error handling
- **Scalable Design**: Modular architecture supporting multiple bot instances

### 📊 Dashboard Features
- **Bot Management**: Create, update, and monitor AI assistants
- **Call History**: Detailed analytics of all patient interactions
- **Real-time Status**: Live system health indicators
- **Domain Flexibility**: Support for medical, legal, and general domains

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- OpenMic account (for voice features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-intake-agent.git
   cd ai-intake-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   WEBHOOK_SECRET=your_webhook_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Run the schema.sql in your Supabase dashboard
   # Or use Supabase CLI
   npx supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── bots/           # Bot CRUD operations
│   │   │   ├── call-logs/      # Call history management
│   │   │   ├── functions/      # Patient data functions
│   │   │   └── webhooks/       # Voice call webhooks
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # Main dashboard
│   ├── lib/
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── env.ts             # Environment configuration
│   │   ├── monitoring.ts      # Performance monitoring
│   │   ├── patient.ts         # Patient data handling
│   │   ├── rate-limit.ts      # API rate limiting
│   │   ├── supabase.ts        # Database client
│   │   ├── validation.ts      # Request validation
│   │   └── webhook.ts         # Webhook processing
│   └── middleware.ts          # Next.js middleware
├── public/                    # Static assets
├── schema.sql                 # Database schema
└── README.md
```

## 🔧 API Reference

### Bot Management
- `GET /api/bots` - List all bots
- `POST /api/bots` - Create a new bot
- `GET /api/bots/[id]` - Get bot details
- `PUT /api/bots/[id]` - Update bot
- `DELETE /api/bots/[id]` - Delete bot

### Call Logs
- `GET /api/call-logs` - Retrieve call history

### Webhooks
- `POST /api/webhooks/pre-call` - Pre-call patient lookup
- `POST /api/webhooks/post-call` - Post-call data logging

### Functions
- `POST /api/functions/fetch-patient` - Patient data retrieval

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm start
```

### Webhook Configuration
Configure your voice platform (OpenMic) webhooks:
- **Pre-call**: `https://your-domain.com/api/webhooks/pre-call`
- **Post-call**: `https://your-domain.com/api/webhooks/post-call`

## 🔒 Security

- **Webhook Validation**: HMAC signature verification
- **Rate Limiting**: API protection against abuse
- **Authentication**: Secure bot management
- **Data Encryption**: Secure patient data handling

## 📈 Monitoring

Built-in monitoring includes:
- API response times
- Error tracking
- Call success rates
- Database performance

---

**Built with ❤️ for healthcare innovation**
