# @inboxpilot/core

Shared utilities used across all InboxPilot Lambda functions.

## Modules

### auth
- `generateOTP()` — 6-digit OTP code
- `generateSessionToken()` — random UUID token
- `getSessionUser(token)` — look up user by API token in DynamoDB
- `parseBearerToken(event)` — extract Bearer token from Authorization header

### constants
- `OTP_TTL_SECONDS` — 10 minutes
- `API_KEY_TTL_SECONDS` — 30 days
- `EXPIRY_OPTIONS` — preset durations: 1d, 7d, 1m, never

### db
- `db` — DynamoDB DocumentClient instance

### email
- `sendEmail({ from, to, subject, html })` — send email via Resend API
- `otpEmailTemplate(otp)` — HTML template for OTP emails
- `apiKeyEmailTemplate(apiKey, name)` — HTML template for API key delivery

### middleware
- `withAuth(handler)` — wraps handler with Bearer token validation, injects `userId`
- `AuthenticatedEvent` — Lambda event type with headers, body, query params
- `AuthContext` — `{ userId: string }`

### response
- `json(statusCode, data)` — Lambda JSON response
- `parseBody(event)` — safe JSON body parser

### validation
Zod schemas for request validation:
- `registerSchema` — name + email
- `loginSchema` — email
- `verifySchema` — email + 6-digit OTP
- `createKeySchema` — name + expiresIn
- `updateKeySchema` — keyId + optional name/expiresIn
- `deleteKeySchema` — keyId

## Usage

```typescript
import { db, json, withAuth, loginSchema, parseBody, sendEmail } from "@inboxpilot/core";
```
