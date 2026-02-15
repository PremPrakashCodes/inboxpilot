import * as cdk from "aws-cdk-lib";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";

const BUCKET_NAME = process.env.LAMBDA_BUCKET || "lambda-dependencies-store";

export interface LambdasProps {
	domain: string;
	tables: {
		accounts: dynamodb.Table;
		users: dynamodb.Table;
		apikeys: dynamodb.Table;
		otp: dynamodb.Table;
	};
}

export interface LambdasResult {
	docs: lambda.Function;
	authRegister: lambda.Function;
	authLogin: lambda.Function;
	authVerify: lambda.Function;
	connectGmail: lambda.Function;
	gmailCallback: lambda.Function;
	accounts: lambda.Function;
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

	const bucket = s3.Bucket.fromBucketName(scope, "LambdaBucket", BUCKET_NAME);

	const docs = new lambda.Function(scope, "InboxPilotDocsFn", {
		functionName: "inboxpilot-docs",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromBucket(bucket, "inboxpilot-docs.zip"),
		role,
	});

	const authRegister = new lambda.Function(scope, "InboxPilotAuthRegisterFn", {
		functionName: "inboxpilot-auth-register",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromBucket(bucket, "inboxpilot-auth-register.zip"),
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
		code: lambda.Code.fromBucket(bucket, "inboxpilot-auth-login.zip"),
		role,
		timeout: cdk.Duration.seconds(10),
		environment: {
			RESEND_API_KEY: process.env.RESEND_API_KEY || "",
			EMAIL_FROM: process.env.EMAIL_FROM || "",
			USERS_TABLE: props.tables.users.tableName,
			OTP_TABLE: props.tables.otp.tableName,
		},
	});

	const authVerify = new lambda.Function(scope, "InboxPilotAuthVerifyFn", {
		functionName: "inboxpilot-auth-verify",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromBucket(bucket, "inboxpilot-auth-verify.zip"),
		role,
		timeout: cdk.Duration.seconds(10),
		environment: {
			RESEND_API_KEY: process.env.RESEND_API_KEY || "",
			EMAIL_FROM: process.env.EMAIL_FROM || "",
			APIKEYS_TABLE: props.tables.apikeys.tableName,
			OTP_TABLE: props.tables.otp.tableName,
		},
	});

	const connectGmail = new lambda.Function(scope, "InboxPilotConnectGmailFn", {
		functionName: "inboxpilot-connect-gmail",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromBucket(bucket, "inboxpilot-connect-gmail.zip"),
		role,
		timeout: cdk.Duration.seconds(10),
		environment: {
			GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
			GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
			GOOGLE_REDIRECT_URI: `https://${props.domain}/auth/gmail/callback`,
			APIKEYS_TABLE: props.tables.apikeys.tableName,
		},
	});

	const gmailCallback = new lambda.Function(
		scope,
		"InboxPilotGmailCallbackFn",
		{
			functionName: "inboxpilot-gmail-callback",
			runtime: lambda.Runtime.NODEJS_22_X,
			handler: "index.handler",
			code: lambda.Code.fromBucket(bucket, "inboxpilot-gmail-callback.zip"),
			role,
			timeout: cdk.Duration.seconds(10),
			environment: {
				GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
				GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
				GOOGLE_REDIRECT_URI: `https://${props.domain}/auth/gmail/callback`,
				ACCOUNTS_TABLE: props.tables.accounts.tableName,
			},
		},
	);

	const accounts = new lambda.Function(scope, "InboxPilotAccountsFn", {
		functionName: "inboxpilot-accounts",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromBucket(bucket, "inboxpilot-accounts.zip"),
		role,
		timeout: cdk.Duration.seconds(10),
		environment: {
			ACCOUNTS_TABLE: props.tables.accounts.tableName,
		},
	});

	const apiKeys = new lambda.Function(scope, "InboxPilotApiKeysFn", {
		functionName: "inboxpilot-api-keys",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromBucket(bucket, "inboxpilot-api-keys.zip"),
		role,
		timeout: cdk.Duration.seconds(10),
		environment: {
			RESEND_API_KEY: process.env.RESEND_API_KEY || "",
			EMAIL_FROM: process.env.EMAIL_FROM || "",
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
						`${props.tables.apikeys.tableArn}/index/*`,
						props.tables.otp.tableArn,
					],
				},
			],
		},
	});

	return {
		docs,
		authRegister,
		authLogin,
		authVerify,
		connectGmail,
		gmailCallback,
		accounts,
		apiKeys,
	};
}
