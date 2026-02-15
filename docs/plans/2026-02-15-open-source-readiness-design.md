# Open Source Readiness Design

**Date:** 2026-02-15
**Goal:** Make InboxPilot fully open-source ready — both contributor-friendly and production-credible.

## Current State

The project has solid foundations: comprehensive README, CI/CD pipelines (lint on PR, deploy on push), 27+ infrastructure tests, Swagger API spec, `.env.example`, and Husky pre-commit hooks with Biome.

Gaps: no license file, no contribution guidelines, no tests for application code, no community templates, and missing repository metadata.

## Phase 1: Governance & Legal Foundation

### FILES

**`LICENSE`**
- ISC license (already declared in package.json)
- Standard ISC text with author name and year

**`CONTRIBUTING.md`**
- Fork, branch, and PR workflow
- Local development setup (docker-compose + DynamoDB Local + `npm run dev`)
- Code style: Biome runs on pre-commit, tabs, double quotes
- Commit convention: conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- Where to ask questions: GitHub Issues

**`CODE_OF_CONDUCT.md`**
- Contributor Covenant v2.1

**`SECURITY.md`**
- How to report vulnerabilities privately
- Use GitHub's private vulnerability reporting
- Response time expectations
- Scope: OAuth tokens, API keys, authentication flows

## Phase 2: Testing & CI Hardening

### Unit Tests for `@inboxpilot/core`

Test coverage for:
- Validation schemas (`registerSchema`, `loginSchema`, `verifySchema`, `createKeySchema`, `updateKeySchema`, `deleteKeySchema`)
- `generateOTP()` — format, length, numeric output
- `generateSessionToken()` — output format, uniqueness
- `json()` — correct statusCode and body serialization
- `parseBody()` — valid JSON, invalid JSON, missing body
- `withAuth` middleware — valid token, expired token, missing header, malformed header

### Unit Tests for API Services

Each service function tested with mocked DynamoDB client:
- `services/user.ts` — findUser (found/not found), createUser
- `services/otp.ts` — createAndSendOtp (mock email), verifyOtp (valid, invalid, expired)
- `services/api-key.ts` — createApiKey, listApiKeys, updateApiKey (found/not found/no fields), deleteApiKey (found/not found), createDefaultApiKey
- `services/gmail.ts` — generateConsentUrl, exchangeCodeAndSaveAccount (success, invalid code, missing email)
- `services/account.ts` — listAccounts (with results, empty)

### Test Tooling

- **Vitest** — fast, native TS support, lighter than Jest for application code
- Add `test` script to `apps/api/package.json` and `packages/core/package.json`
- Coverage via Vitest's built-in istanbul provider

### CI Enhancements

Update `.github/workflows/ci.yml`:
- Add test job after lint
- Add coverage reporting
- Fail PR if coverage drops below threshold (70% for core, 50% for services initially)

### Out of Scope

- No E2E tests against real AWS
- No snapshot tests

## Phase 3: GitHub Community Files & Developer Experience

### Issue Templates (`.github/ISSUE_TEMPLATE/`)

**`bug_report.md`**
- Steps to reproduce
- Expected vs actual behavior
- Environment info (Node version, OS)

**`feature_request.md`**
- Problem description
- Proposed solution
- Alternatives considered

**`question.md`**
- General help questions

### PR Template (`.github/PULL_REQUEST_TEMPLATE.md`)

Checklist:
- Description of changes
- Related issue number
- Tests added/updated
- `npm run build` passes
- `npm run format` passes

### CHANGELOG.md

- Keep a Changelog format (Added, Changed, Fixed, Removed)
- Start with v1.0.0 documenting current feature set

### README.md Improvements

- Badges: CI status, license, Node version
- "Contributing" section linking to CONTRIBUTING.md
- "Security" section linking to SECURITY.md
- Local development setup documentation (docker-compose + DynamoDB Local)

### Out of Scope

- No GitHub Discussions (premature)
- No release automation (manual is fine)
- No Discord/Slack

## Phase 4: Code Quality & Repository Hygiene

### New Files

**`.editorconfig`**
- Tabs for indentation (matches Biome)
- LF line endings
- Trim trailing whitespace
- Final newline

**`.nvmrc`**
- Lock to Node 22

**`.gitattributes`**
- `* text=auto` for consistent line endings

### package.json Enhancements

- `engines`: `{ "node": ">=22" }`
- `description`: project summary
- `repository`, `homepage`, `bugs` fields for GitHub/npm discoverability
- `keywords`: email, api, gmail, oauth, serverless, aws-lambda

### CI Refinement

- Add `--error-on-warnings` to Biome in CI to prevent warning accumulation

## Implementation Order

1. **Phase 1** — Governance files (no code changes, immediate credibility boost)
2. **Phase 4** — Repository hygiene (small config files, quick wins)
3. **Phase 3** — Community files and README updates
4. **Phase 2** — Testing (largest effort, most impactful for long-term quality)

Each phase can be a separate PR for clean review.
