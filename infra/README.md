# InboxPilot Infrastructure

AWS CDK v2 stack for InboxPilot. Deploys Lambda functions, API Gateway v2, DynamoDB tables, and IAM policies.

## Resources

### DynamoDB Tables
- `inboxpilot-users` — user registration (PK: `pk`)
- `inboxpilot-accounts` — multi-provider OAuth accounts (PK: `userId`, SK: `sk`)
- `inboxpilot-apikeys` — API keys with GSI `userId-index` (PK: `pk`, TTL: `ttl`)
- `inboxpilot-otp` — OTP codes with TTL auto-expiry (PK: `pk`, TTL: `ttl`)

### Lambda Functions
- `inboxpilot-docs` — Swagger UI
- `inboxpilot-auth-register` — user registration
- `inboxpilot-auth-login` — OTP email sender
- `inboxpilot-auth-verify` — OTP verification + API key creation
- `inboxpilot-connect-gmail` — Google OAuth URL generator
- `inboxpilot-gmail-callback` — Google OAuth callback handler
- `inboxpilot-accounts` — list connected accounts
- `inboxpilot-api-keys` — API key CRUD

### API Gateway
- HTTP API v2 with custom domain and CORS
- ACM certificate for TLS
- All routes mapped to individual Lambda integrations

### IAM
- Shared `AWSLambdaBasicExecutionRole` across all Lambdas
- Inline DynamoDB policy for PutItem, GetItem, UpdateItem, DeleteItem, Query

## Structure

```
infra/
  lib/
    infra-stack.ts           # Main stack
    constructs/
      tables.ts              # DynamoDB table definitions
      lambdas.ts             # Lambda function definitions + IAM
      api.ts                 # API Gateway + routes
  test/
    infra.test.ts            # CDK assertions (27 tests)
```

## Commands

```bash
npx jest              # Run infrastructure tests
npx cdk synth         # Synthesize CloudFormation template
npx cdk deploy        # Deploy stack
npx cdk diff          # Compare deployed vs current
npx cdk destroy       # Tear down stack
```

Must run from the `infra/` directory.
