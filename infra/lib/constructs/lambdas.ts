import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";

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
	docs: lambda.Function;
	authRegister: lambda.Function;
	authLogin: lambda.Function;
	authVerify: lambda.Function;
	connectGmail: lambda.Function;
	apiKeys: lambda.Function;
}

export function createLambdas(
	scope: cdk.Stack,
	props: LambdasProps,
): LambdasResult {
	const role = iam.Role.fromRoleName(
		scope,
		"LambdaExecutionRole",
		"AWSLambdaBasicExecutionRole",
	);

	const docs = new lambda.Function(scope, "InboxPilotDocsFn", {
		functionName: "inboxpilot-docs",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromAsset(path.join(APPS, "docs/dist")),
		role,
	});

	const authRegister = new lambda.Function(scope, "InboxPilotAuthRegisterFn", {
		functionName: "inboxpilot-auth-register",
		runtime: lambda.Runtime.NODEJS_22_X,
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
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromAsset(path.join(APPS, "auth/login/dist")),
		role,
		timeout: cdk.Duration.seconds(10),
		environment: {
			RESEND_API_KEY: process.env.RESEND_API_KEY || "",
			EMAIL_FROM: process.env.EMAIL_FROM || "",
			USERS_TABLE: props.tables.users.tableName,
			APIKEYS_TABLE: props.tables.apikeys.tableName,
		},
	});

	const authVerify = new lambda.Function(scope, "InboxPilotAuthVerifyFn", {
		functionName: "inboxpilot-auth-verify",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromAsset(path.join(APPS, "auth/verify/dist")),
		role,
		timeout: cdk.Duration.seconds(10),
		environment: {
			RESEND_API_KEY: process.env.RESEND_API_KEY || "",
			EMAIL_FROM: process.env.EMAIL_FROM || "",
			APIKEYS_TABLE: props.tables.apikeys.tableName,
		},
	});

	const connectGmail = new lambda.Function(scope, "InboxPilotConnectGmailFn", {
		functionName: "inboxpilot-connect-gmail",
		runtime: lambda.Runtime.NODEJS_22_X,
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

	const apiKeys = new lambda.Function(scope, "InboxPilotApiKeysFn", {
		functionName: "inboxpilot-api-keys",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromAsset(path.join(APPS, "api-keys/dist")),
		role,
		timeout: cdk.Duration.seconds(10),
		environment: {
			RESEND_API_KEY: process.env.RESEND_API_KEY || "",
			EMAIL_FROM: process.env.EMAIL_FROM || "",
			APIKEYS_TABLE: props.tables.apikeys.tableName,
		},
	});

	// Grant DynamoDB access to shared role (includes GSI)
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
						`${props.tables.apikeys.tableArn}/index/*`,
					],
				},
			],
		},
	});

	return { docs, authRegister, authLogin, authVerify, connectGmail, apiKeys };
}
