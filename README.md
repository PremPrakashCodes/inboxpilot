# InboxPilot

Serverless email management API with OTP-based authentication, Gmail OAuth integration, and API key management. Runs entirely on AWS Lambda with zero server costs at low traffic.

## Features

- **Passwordless auth** — register with email, login via OTP, receive API key
- **Gmail integration** — connect Gmail accounts via OAuth 2.0
- **API key management** — create, list, update, and delete keys with configurable expiry
- **Swagger docs** — interactive API documentation served from Lambda
- **CI/CD** — GitHub Actions with AWS OIDC (no long-lived access keys)

## Tech Stack

- **Runtime:** Node.js 22 on AWS Lambda
- **Infrastructure:** AWS CDK v2 (TypeScript)
- **API:** HTTP API Gateway v2 with custom domain
- **Database:** DynamoDB (4 tables)
- **Email:** [Resend](https://resend.com) SDK
- **Auth:** OTP-based login + Bearer token API keys
- **OAuth:** Google (extensible to Microsoft, etc.)
- **Build:** esbuild for Lambda bundling
- **Lint:** [Biome](https://biomejs.dev)
- **Monorepo:** npm workspaces

## Project Structure

```
inboxpilot/
  apps/
    auth/register/          # POST /auth/register
    auth/login/             # POST /auth/login
    auth/verify/            # POST /auth/verify
    auth/gmail/callback/    # GET  /auth/gmail/callback
    connect/gmail/          # GET  /connect/gmail
    accounts/               # GET  /accounts
    keys/                   # GET/POST/PATCH/DELETE /keys
    docs/                   # GET  /docs (Swagger UI)
  packages/
    core/                   # Shared: auth, email, validation, DynamoDB, middleware
    tsconfig/               # Shared TypeScript config
  infra/                    # AWS CDK stack (Lambda, API Gateway, DynamoDB, IAM)
  scripts/
    build.sh                # Bundle + zip + upload to S3
  .github/
    workflows/
      ci.yml                # PR checks (lint + build)
      deploy.yml            # Deploy on push to main
```

## Prerequisites

- Node.js 22+
- AWS account with CLI configured
- S3 bucket for Lambda code storage
- [Resend](https://resend.com) account for sending emails
- Google Cloud project with OAuth 2.0 credentials for Gmail integration

## Setup

1. **Clone and install**

```bash
git clone https://github.com/<your-username>/inboxpilot.git
cd inboxpilot
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Fill in your values:

| Variable | Description |
|----------|-------------|
| `INBOXPILOT_DOMAIN` | Custom domain for the API (e.g. `api.example.com`) |
| `LAMBDA_BUCKET` | S3 bucket for Lambda code (e.g. `my-lambda-bucket`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `EMAIL_FROM` | Sender address (e.g. `MyApp <no-reply@example.com>`) |

3. **Build**

```bash
npm run build
```

Bundles all Lambda functions with esbuild, zips them, and uploads to your S3 bucket.

4. **Deploy**

```bash
npm run deploy
```

Runs build + CDK deploy. Creates all AWS resources (Lambda, API Gateway, DynamoDB, IAM).

5. **DNS setup**

After first deploy, CDK outputs the API Gateway domain target. Add a CNAME record in your DNS provider pointing your custom domain to this target.

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build core + bundle all Lambdas + upload to S3 |
| `npm run deploy` | Build + CDK deploy to AWS |
| `npm test` | Run tests across all workspaces |
| `npm run format` | Lint/format with Biome |
| `SKIP_UPLOAD=1 npm run build` | Build without S3 upload (offline dev) |

> **Commit failing?** A pre-commit hook runs Biome to check formatting. Run `npm run format` to auto-fix, then commit again.

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

## CI/CD

GitHub Actions automates linting, building, and deployment:

- **`ci.yml`** — runs on pull requests: lint + build verification
- **`deploy.yml`** — runs on push to main: build + upload to S3 + CDK deploy

Uses AWS OIDC federation for secure, keyless authentication. See [infra/README.md](infra/README.md#cicd) for full setup instructions.

## API Docs

Interactive Swagger UI is available at `/docs` once deployed.

## License

ISC
