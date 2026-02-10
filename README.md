# InboxPilot

OTP-based auth and Gmail integration API, built with AWS serverless.

## Stack

- **Runtime:** Node 22 Lambda functions
- **Infrastructure:** AWS CDK v2 (TypeScript)
- **API:** HTTP API Gateway v2 with custom domain
- **Database:** DynamoDB
- **Email:** Resend (via native fetch)
- **Monorepo:** npm workspaces

## Project Structure

```
apps/
  auth/register/   # POST /auth/register
  auth/login/      # POST /auth/login — sends OTP via email
  auth/verify/     # POST /auth/verify — sends API key via email
  api-keys/        # CRUD /keys — manage API keys (Bearer auth)
  connect/gmail/   # GET  /connect/gmail — Google OAuth flow
  docs/            # GET  /docs — Swagger UI
packages/
  core/            # Shared utilities (auth, email, validation, DynamoDB)
infra/             # CDK stack (Lambda, API Gateway, DynamoDB)
```

## Setup

```bash
npm install
cp .env.example .env  # fill in values
```

### Environment Variables

| Variable                | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `INBOXPILOT_DOMAIN`     | Custom domain (e.g. `inboxpilot.premprakash.dev`)    |
| `GOOGLE_CLIENT_ID`      | Google OAuth client ID                               |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret                           |
| `RESEND_API_KEY`        | Resend API key for sending emails                    |
| `EMAIL_FROM`            | Sender address (e.g. `InboxPilot <no-reply@...>`)    |

## Scripts

```bash
npm run build    # Bundle all Lambdas
npm run deploy   # Build + CDK deploy
npm test         # Run tests across workspaces
```

## API Docs

Interactive Swagger UI is available at `/docs` once deployed.
