# InboxPilot Frontend UI Design

## Overview

Landing page + authenticated dashboard for InboxPilot, deployed on AWS serverless alongside the existing backend.

## Stack

- Next.js 16 (App Router) in `apps/web/`
- shadcn/ui + Tailwind CSS
- OpenNext for AWS Lambda packaging
- CDK for infrastructure (CloudFront + S3 + Lambda)

## Domains

- `inboxpilot.premprakash.dev` → CloudFront (frontend)
- `api.inboxpilot.premprakash.dev` → API Gateway (backend, migrated from main domain)

## Architecture

```
inboxpilot.premprakash.dev (frontend)
    ↓
CloudFront → S3 (static assets) + Lambda (SSR)
    ↓
api.inboxpilot.premprakash.dev (backend)
    ↓
API Gateway v2 → Lambda functions → DynamoDB
```

## Pages

| Route | Auth | Purpose |
|---|---|---|
| `/` | No | Landing page |
| `/login` | No | Email + OTP login |
| `/register` | No | Sign up |
| `/dashboard` | Yes | Overview |
| `/dashboard/accounts` | Yes | Connected Gmail accounts |
| `/dashboard/keys` | Yes | API key management |

## Landing Page

Sections (top to bottom):

1. **Hero** — Headline, subtext, CTAs: "Get Started" → `/register`, "View Docs" → `/docs`
2. **Features** — Cards: passwordless auth, Gmail integration, API-first, API key management
3. **How it works** — 3 steps: register, connect Gmail, manage via API
4. **Footer** — Links to GitHub repo, docs, API reference

Design: dark theme, minimal, fully static (SSG), mobile responsive.

## Dashboard

Common layout: collapsible sidebar nav + main content area.

Sidebar nav: logo, Dashboard, Accounts, API Keys, Logout.

### `/dashboard` — Overview

- Welcome message with user's name
- Stats cards: connected accounts count, active API keys count
- Quick actions: "Connect Gmail", "Create API Key"

### `/dashboard/accounts` — Connected Accounts

- Table: provider icon, email address, connected date
- "Connect Gmail" button → calls `GET /connect/gmail`, redirects to Google OAuth

### `/dashboard/keys` — API Key Management

- Table: key name, masked token, created date, expires date, status
- "Create Key" button → modal (name + expiry dropdown: 1d, 7d, 1m, never)
- Row actions: Edit (modal for name/expiry), Delete (confirmation dialog)
- Toast notifications for success/error

### State Management

- React Server Components for data fetching
- Client components for interactions
- `fetch` with auth cookie (automatic)
- Loading skeletons for tables

## Auth Flow

1. User enters email → `POST /auth/login` → OTP sent via email
2. User enters OTP → `POST /auth/verify` → API key returned
3. API key stored in `httpOnly` cookie (secure, not accessible to JS)
4. Next.js middleware checks cookie on `/dashboard/*`, redirects to `/login` if missing

## Infrastructure (CDK)

New resources added to existing stack:

- S3 Bucket — static assets (JS, CSS, images)
- Lambda Function — Next.js server (SSR)
- CloudFront — CDN in front of S3 + Lambda
- ACM Certificate — TLS for main domain (or wildcard)
- DNS (Cloudflare) — CNAME updates

API domain migration:
- `inboxpilot.premprakash.dev` → CloudFront (was API Gateway)
- `api.inboxpilot.premprakash.dev` → API Gateway (new subdomain)

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your API base URL (e.g. `https://api.example.com`) |

## File Structure

```
apps/web/
├── next.config.ts
├── package.json
├── tsconfig.json
├── public/
│   └── logo.svg
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Login form
│   ├── register/page.tsx       # Register form
│   └── dashboard/
│       ├── layout.tsx          # Sidebar + auth check
│       ├── page.tsx            # Overview
│       ├── accounts/page.tsx   # Connected accounts
│       └── keys/page.tsx       # API key management
├── components/
│   ├── ui/                     # shadcn components
│   ├── landing/                # Hero, Features, HowItWorks, Footer
│   ├── dashboard/              # Sidebar, StatsCard, KeysTable, AccountsTable
│   └── auth/                   # LoginForm, RegisterForm, OTPInput
├── lib/
│   ├── api.ts                  # API client
│   └── utils.ts                # shadcn cn() helper
└── middleware.ts               # Auth cookie check
```

## Deployment

- `deploy.yml` extended: build frontend → OpenNext → upload static to S3 → CDK deploy
- Existing backend build (`scripts/build.sh`) unchanged
- Same OIDC auth, same GitHub Actions workflow
