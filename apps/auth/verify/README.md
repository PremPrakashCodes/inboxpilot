# POST /auth/verify

Verifies an OTP and returns a session token (30-day expiry).

## Request

```json
{ "email": "user@example.com", "otp": "123456" }
```

Pass `"new": true` to force a new session token even if one exists.

## Responses

| Status | Description                      |
| ------ | -------------------------------- |
| 200    | Verified, returns `sessionToken` |
| 400    | Missing email or otp             |
| 401    | Invalid or expired OTP           |

## Environment Variables

| Variable        | Description                                |
| --------------- | ------------------------------------------ |
| `APIKEYS_TABLE` | DynamoDB table for OTP and session storage |
