# Contributing to InboxPilot

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 22+
- Docker (for local DynamoDB)
- Git

### Local Development Setup

1. **Fork and clone**

```bash
git clone https://github.com/<your-username>/inboxpilot.git
cd inboxpilot
npm install
```

2. **Start DynamoDB Local**

```bash
docker compose up -d
```

3. **Configure environment**

```bash
cp .env.example .env
```

4. **Create local tables**

```bash
npx tsx scripts/create-tables.ts
```

5. **Start the dev server**

```bash
npx tsx scripts/dev-server.ts
```

The API is now running at `http://localhost:3000`.

### Verify the Build

```bash
SKIP_UPLOAD=1 npm run build
```

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/add-microsoft-oauth`
- `fix/expired-otp-handling`
- `docs/update-setup-instructions`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Microsoft OAuth provider
fix: handle expired OTP gracefully
docs: update local development setup
test: add unit tests for OTP service
chore: update dependencies
```

### Code Style

This project uses [Biome](https://biomejs.dev) for linting and formatting. A pre-commit hook runs automatically, but you can also run it manually:

```bash
npm run format
```

Rules:
- Tabs for indentation
- Double quotes for strings
- No unused imports (auto-removed)

### Type Checking

```bash
npm run typecheck --workspace=apps/api
```

## Submitting a Pull Request

1. Create a feature branch from `main`
2. Make your changes
3. Ensure the build passes: `SKIP_UPLOAD=1 npm run build`
4. Ensure formatting passes: `npm run format`
5. Push your branch and open a PR against `main`
6. Fill in the PR template

## Project Structure

```
apps/api/src/
  routes/       # HTTP handlers (thin — parse request, call service, return response)
  services/     # Business logic and database operations
  utils/        # Utility functions
  lib/          # Shared library code
packages/
  core/         # Shared: auth, email, validation, DynamoDB client, middleware
  tsconfig/     # Shared TypeScript configuration
infra/          # AWS CDK infrastructure
scripts/        # Build and dev tooling
```

**Routes** handle HTTP concerns only — parsing input, calling services, returning responses.

**Services** contain all business logic and database operations.

## Questions?

Open a [GitHub Issue](https://github.com/PremPrakashCodes/inboxpilot/issues) and we'll help you out.
