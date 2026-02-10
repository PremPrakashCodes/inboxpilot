# GET /connect/gmail

Connects a Gmail account via Google OAuth. Requires `Authorization: Bearer <sessionToken>` header.

## Flow

1. Initial request redirects (302) to Google consent screen
2. Google calls back with `?code=...&state=...`
3. Callback exchanges code for tokens, stores credentials in DynamoDB

## Scopes

- `gmail.readonly`
- `gmail.send`
- `gmail.modify`

## Environment Variables

| Variable               | Description                           |
| ---------------------- | ------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret            |
| `GOOGLE_REDIRECT_URI`  | OAuth callback URL                    |
| `ACCOUNTS_TABLE`       | DynamoDB table for connected accounts |
| `APIKEYS_TABLE`        | DynamoDB table for API validation     |
