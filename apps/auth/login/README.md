# POST /auth/login

Sends a 6-digit OTP to the user's email via Resend.

## Request

```json
{ "email": "user@example.com" }
```

## Responses

| Status | Description    |
| ------ | -------------- |
| 200    | OTP sent       |
| 400    | Missing email  |
| 404    | User not found |

## Environment Variables

| Variable         | Description                    |
| ---------------- | ------------------------------ |
| `USERS_TABLE`    | DynamoDB table for user lookup |
| `APIKEYS_TABLE`  | DynamoDB table for OTP storage |
| `RESEND_API_KEY` | Resend API key                 |
| `EMAIL_FROM`     | Sender address                 |
