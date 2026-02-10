# POST /auth/register

Registers a new user.

## Request

```json
{ "name": "John", "email": "user@example.com" }
```

## Responses

| Status | Description           |
| ------ | --------------------- |
| 201    | User registered       |
| 400    | Missing name or email |
| 409    | User already exists   |

## Environment Variables

| Variable      | Description                     |
| ------------- | ------------------------------- |
| `USERS_TABLE` | DynamoDB table for user records |
