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

## CI/CD

GitHub Actions automates linting, building, and deploying.

### Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | Pull request to `main` | Lint (Biome) + Build (no deploy) |
| `deploy.yml` | Push to `main` | Build + Upload to S3 + CDK deploy |

### AWS OIDC Setup (one-time)

GitHub Actions authenticates to AWS using OIDC federation — no long-lived access keys.

**Step 1: Create IAM Identity Provider**

1. Go to **IAM > Identity providers > Add provider**
2. Provider type: **OpenID Connect**
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`

**Step 2: Create IAM Role**

1. Go to **IAM > Roles > Create role**
2. Trusted entity: **Web identity**
3. Identity provider: `token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. GitHub organization: `<your-github-username>`
6. GitHub repository: `inboxpilot`
7. GitHub branch: `main`
8. Role name: `inboxpilot-github-deploy`

**Step 3: Attach permissions to the role**

**Option A: Managed policies (quick setup)**

Attach these AWS managed policies for a quick start:

- `AmazonS3FullAccess`
- `AWSCloudFormationFullAccess`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `AmazonDynamoDBFullAccess`
- `IAMFullAccess`
- `AWSCertificateManagerFullAccess`

**Option B: Custom policy (least-privilege, recommended for production)**

Create an inline policy named `inboxpilot-deploy-access`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::<your-lambda-bucket>",
        "arn:aws:s3:::<your-lambda-bucket>/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "cloudformation:*",
      "Resource": "arn:aws:cloudformation:<region>:<account-id>:stack/InfraStack/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:GetTemplate",
        "cloudformation:CreateChangeSet",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DeleteChangeSet",
        "cloudformation:DescribeStackEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "lambda:*",
      "Resource": "arn:aws:lambda:<region>:<account-id>:function:inboxpilot-*"
    },
    {
      "Effect": "Allow",
      "Action": "apigateway:*",
      "Resource": "arn:aws:apigateway:<region>::*"
    },
    {
      "Effect": "Allow",
      "Action": "dynamodb:*",
      "Resource": "arn:aws:dynamodb:<region>:<account-id>:table/inboxpilot-*"
    },
    {
      "Effect": "Allow",
      "Action": ["iam:GetRole", "iam:PassRole", "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:GetRolePolicy"],
      "Resource": "arn:aws:iam::<account-id>:role/AWSLambdaBasicExecutionRole"
    },
    {
      "Effect": "Allow",
      "Action": ["acm:DescribeCertificate", "acm:RequestCertificate", "acm:ListCertificates"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "ssm:GetParameter",
      "Resource": "arn:aws:ssm:<region>:<account-id>:parameter/cdk-bootstrap/*"
    }
  ]
}
```

Replace `<region>`, `<account-id>`, and `<your-lambda-bucket>` with your values.

**Step 4: Add GitHub Secrets**

Go to **GitHub repo > Settings > Secrets and variables > Actions** and add:

| Secret | Value |
|--------|-------|
| `AWS_ROLE_ARN` | `arn:aws:iam::<account-id>:role/inboxpilot-github-deploy` |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `INBOXPILOT_DOMAIN` | Your custom domain (e.g. `api.example.com`) |
| `LAMBDA_BUCKET` | Your S3 bucket for Lambda code (e.g. `my-lambda-bucket`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Sender address (e.g. `MyApp <no-reply@example.com>`) |
