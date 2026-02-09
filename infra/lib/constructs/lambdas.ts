import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

const APPS = path.join(__dirname, "../../../apps");

export interface LambdasProps {
  domain: string;
  tables: {
    accounts: dynamodb.Table;
    users: dynamodb.Table;
    apikeys: dynamodb.Table;
  };
}

export interface LambdasResult {
  health: lambda.Function;
  authRegister: lambda.Function;
  authLogin: lambda.Function;
  authVerify: lambda.Function;
  connectGmail: lambda.Function;
}

export function createLambdas(scope: cdk.Stack, props: LambdasProps): LambdasResult {
  const role = iam.Role.fromRoleName(scope, "LambdaExecutionRole", "AWSLambdaBasicExecutionRole");

  const health = new lambda.Function(scope, "InboxPilotHealthFn", {
    functionName: "inboxpilot-health",
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(path.join(APPS, "health/dist")),
    role,
  });

  const authRegister = new lambda.Function(scope, "InboxPilotAuthRegisterFn", {
    functionName: "inboxpilot-auth-register",
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(path.join(APPS, "auth/register/dist")),
    role,
    timeout: cdk.Duration.seconds(10),
    environment: {
      USERS_TABLE: props.tables.users.tableName,
    },
  });

  const authLogin = new lambda.Function(scope, "InboxPilotAuthLoginFn", {
    functionName: "inboxpilot-auth-login",
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(path.join(APPS, "auth/login/dist")),
    role,
    timeout: cdk.Duration.seconds(10),
    environment: {
      RESEND_API_KEY: process.env.RESEND_API_KEY || "",
      USERS_TABLE: props.tables.users.tableName,
      APIKEYS_TABLE: props.tables.apikeys.tableName,
    },
  });

  const authVerify = new lambda.Function(scope, "InboxPilotAuthVerifyFn", {
    functionName: "inboxpilot-auth-verify",
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(path.join(APPS, "auth/verify/dist")),
    role,
    timeout: cdk.Duration.seconds(10),
    environment: {
      APIKEYS_TABLE: props.tables.apikeys.tableName,
    },
  });

  const connectGmail = new lambda.Function(scope, "InboxPilotConnectGmailFn", {
    functionName: "inboxpilot-connect-gmail",
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(path.join(APPS, "connect/gmail/dist")),
    role,
    timeout: cdk.Duration.seconds(10),
    environment: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
      GOOGLE_REDIRECT_URI: `https://${props.domain}/connect/gmail`,
      ACCOUNTS_TABLE: props.tables.accounts.tableName,
      APIKEYS_TABLE: props.tables.apikeys.tableName,
    },
  });

  // Grant DynamoDB access to shared role
  new iam.CfnRolePolicy(scope, "InboxPilotDynamoPolicy", {
    roleName: "AWSLambdaBasicExecutionRole",
    policyName: "inboxpilot-dynamo-access",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
          ],
          Resource: [
            props.tables.accounts.tableArn,
            props.tables.users.tableArn,
            props.tables.apikeys.tableArn,
          ],
        },
      ],
    },
  });

  return { health, authRegister, authLogin, authVerify, connectGmail };
}
