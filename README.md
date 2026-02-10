# InboxPilot

API service for managing email inboxes with OTP-based authentication and multi-provider OAuth account linking.

## Stack

- **Runtime:** Node.js 22 Lambda functions
- **Infrastructure:** AWS CDK v2 (TypeScript)
- **API:** HTTP API Gateway v2 with custom domain
- **Database:** DynamoDB (4 tables)
- **Email:** Resend SDK
- **Auth:** OTP-based login + Bearer token API keys
- **OAuth:** Google (extensible to Microsoft, etc.)
- **Monorepo:** npm workspaces

## Project Structure

```
apps/
  auth/register/       # POST /auth/register — create user
  auth/login/          # POST /auth/login — send OTP via email
  auth/verify/         # POST /auth/verify — verify OTP, email API key
  auth/gmail/callback/ # GET  /auth/gmail/callback — OAuth callback
  connect/gmail/       # GET  /connect/gmail — Google OAuth consent URL
  accounts/            # GET  /accounts — list connected accounts
  keys/                # CRUD /keys — manage API keys (Bearer auth)
  docs/                # GET  /docs — Swagger UI
packages/
  core/                # Shared: auth, email, validation, DynamoDB, middleware
  tsconfig/            # Shared TypeScript config
infra/                 # CDK stack (Lambda, API Gateway, DynamoDB, IAM)
scripts/
  build.sh             # Builds core + bundles all Lambdas via esbuild
```

## Setup

```bash
npm install
cp .env.example .env  # fill in values
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `INBOXPILOT_DOMAIN` | Custom domain (e.g. `inboxpilot.premprakash.dev`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `EMAIL_FROM` | Sender address (e.g. `InboxPilot <no-reply@example.com>`) |

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build core package + bundle all Lambdas |
| `npm run deploy` | Build + CDK deploy to AWS |
| `npm test` | Run tests across all workspaces |
| `npm run format` | Format code with Biome |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | - | Register with name + email |
| `POST` | `/auth/login` | - | Send OTP to email |
| `POST` | `/auth/verify` | - | Verify OTP, receive API key via email |
| `GET` | `/connect/gmail` | Bearer | Get Google OAuth consent URL |
| `GET` | `/auth/gmail/callback` | - | OAuth callback (Google redirects here) |
| `GET` | `/accounts` | Bearer | List connected provider accounts |
| `GET` | `/keys` | Bearer | List API keys |
| `POST` | `/keys` | Bearer | Create API key |
| `PATCH` | `/keys` | Bearer | Update API key |
| `DELETE` | `/keys` | Bearer | Delete API key |
| `GET` | `/docs` | - | Swagger UI documentation |

## DynamoDB Tables

| Table | PK | SK | Purpose |
|-------|----|----|---------|
| `inboxpilot-users` | `pk` (email) | - | User registration |
| `inboxpilot-accounts` | `userId` (email) | `sk` (`provider#accountId`) | Multi-provider OAuth accounts |
| `inboxpilot-apikeys` | `pk` (token/keyref) | - | API keys + key references (GSI: `userId-index`) |
| `inboxpilot-otp` | `pk` (`otp#email`) | - | OTP codes (TTL auto-expiry) |

The accounts table supports multiple providers (Google, Microsoft, etc.) and multiple accounts per provider per user.

## Deployment

Requires AWS CLI configured and CDK bootstrapped:

```bash
npm run deploy
```

Point your domain's CNAME to the API Gateway domain target from the stack output.

## API Docs

Interactive Swagger UI is available at `/docs` once deployed.
