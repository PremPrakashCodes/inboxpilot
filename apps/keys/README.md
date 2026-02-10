# CRUD /keys

Manage API keys. All endpoints require Bearer auth.

## Endpoints

### POST /keys — Create

```json
{ "name": "Production", "expiresIn": "7d" }
```

`expiresIn` accepts: `1d`, `7d`, `1m`, `never`, or a number (custom days).

The API key is sent to the user's email — never returned in the response.

| Status | Description                 |
| ------ | --------------------------- |
| 201    | Key created, sent via email |
| 400    | Invalid input               |
| 401    | Missing or invalid token    |

### GET /keys — List

Returns all keys for the authenticated user (tokens are masked).

| Status | Description              |
| ------ | ------------------------ |
| 200    | List of keys             |
| 401    | Missing or invalid token |

### PATCH /keys — Update

```json
{ "keyId": "uuid", "name": "Staging", "expiresIn": "1m" }
```

| Status | Description              |
| ------ | ------------------------ |
| 200    | Key updated              |
| 400    | Invalid input            |
| 401    | Missing or invalid token |
| 404    | Key not found            |

### DELETE /keys — Delete

```json
{ "keyId": "uuid" }
```

| Status | Description              |
| ------ | ------------------------ |
| 200    | Key deleted              |
| 401    | Missing or invalid token |
| 404    | Key not found            |

## Environment Variables

| Variable         | Description                        |
| ---------------- | ---------------------------------- |
| `APIKEYS_TABLE`  | DynamoDB table for API key storage |
| `RESEND_API_KEY` | Resend API key                     |
| `EMAIL_FROM`     | Sender address                     |
