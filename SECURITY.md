# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in InboxPilot, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, use [GitHub's private vulnerability reporting](https://github.com/PremPrakashCodes/inboxpilot/security/advisories/new) to submit your report confidentially.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix or mitigation:** Depends on severity, but we aim for prompt resolution

## Scope

The following areas are in scope for security reports:

- Authentication flows (OTP generation, verification, token handling)
- API key management (generation, storage, validation, expiry)
- OAuth token handling (Google OAuth flow, token storage)
- DynamoDB access patterns and data exposure
- Authorization bypass in protected endpoints

## Out of Scope

- Bugs that do not have a security impact (use [GitHub Issues](https://github.com/PremPrakashCodes/inboxpilot/issues) instead)
- Third-party services (Resend, Google APIs, AWS)
- Social engineering
