import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { InfraStack } from "../lib/infra-stack";

let template: Template;

beforeAll(() => {
	process.env.INBOXPILOT_DOMAIN = "example.com";
	const app = new cdk.App();
	const stack = new InfraStack(app, "TestStack");
	template = Template.fromStack(stack);
});

test("Docs Lambda created with Node.js 22", () => {
	template.hasResourceProperties("AWS::Lambda::Function", {
		FunctionName: "inboxpilot-docs",
		Runtime: "nodejs22.x",
		Handler: "index.handler",
	});
});

test("Connect Gmail Lambda created with Node.js 22", () => {
	template.hasResourceProperties("AWS::Lambda::Function", {
		FunctionName: "inboxpilot-connect-gmail",
		Runtime: "nodejs22.x",
		Handler: "index.handler",
	});
});

test("API Keys Lambda created with Node.js 22", () => {
	template.hasResourceProperties("AWS::Lambda::Function", {
		FunctionName: "inboxpilot-api-keys",
		Runtime: "nodejs22.x",
		Handler: "index.handler",
	});
});

test("DynamoDB accounts table created", () => {
	template.hasResourceProperties("AWS::DynamoDB::Table", {
		TableName: "inboxpilot-accounts",
		KeySchema: [
			{ AttributeName: "userId", KeyType: "HASH" },
			{ AttributeName: "sk", KeyType: "RANGE" },
		],
		BillingMode: "PAY_PER_REQUEST",
	});
});

test("DynamoDB users table created", () => {
	template.hasResourceProperties("AWS::DynamoDB::Table", {
		TableName: "inboxpilot-users",
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
	});
});

test("DynamoDB apikeys table created", () => {
	template.hasResourceProperties("AWS::DynamoDB::Table", {
		TableName: "inboxpilot-apikeys",
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
		TimeToLiveSpecification: {
			AttributeName: "ttl",
			Enabled: true,
		},
	});
});

test("Accounts Lambda created with Node.js 22", () => {
	template.hasResourceProperties("AWS::Lambda::Function", {
		FunctionName: "inboxpilot-accounts",
		Runtime: "nodejs22.x",
		Handler: "index.handler",
	});
});

test("DynamoDB OTP table created", () => {
	template.hasResourceProperties("AWS::DynamoDB::Table", {
		TableName: "inboxpilot-otp",
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
		TimeToLiveSpecification: {
			AttributeName: "ttl",
			Enabled: true,
		},
	});
});

test("GET /accounts route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "GET /accounts",
	});
});

test("DynamoDB apikeys table has userId GSI", () => {
	template.hasResourceProperties("AWS::DynamoDB::Table", {
		TableName: "inboxpilot-apikeys",
		GlobalSecondaryIndexes: [
			{
				IndexName: "userId-index",
				KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
				Projection: { ProjectionType: "ALL" },
			},
		],
	});
});

test("DynamoDB policy attached to shared role", () => {
	template.hasResourceProperties("AWS::IAM::RolePolicy", {
		RoleName: "AWSLambdaBasicExecutionRole",
		PolicyName: "inboxpilot-dynamo-access",
	});
});

test("HTTP API created", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
		Name: "InboxPilot Backend",
		ProtocolType: "HTTP",
	});
});

test("CORS configured on HTTP API", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
		CorsConfiguration: {
			AllowHeaders: ["Content-Type", "Authorization"],
			AllowMethods: ["*"],
			AllowOrigins: ["*"],
		},
	});
});

test("Auth Register Lambda created with Node.js 22", () => {
	template.hasResourceProperties("AWS::Lambda::Function", {
		FunctionName: "inboxpilot-auth-register",
		Runtime: "nodejs22.x",
		Handler: "index.handler",
	});
});

test("POST /auth/register route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "POST /auth/register",
	});
});

test("Auth Login Lambda created with Node.js 22", () => {
	template.hasResourceProperties("AWS::Lambda::Function", {
		FunctionName: "inboxpilot-auth-login",
		Runtime: "nodejs22.x",
		Handler: "index.handler",
	});
});

test("POST /auth/login route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "POST /auth/login",
	});
});

test("Auth Verify Lambda created with Node.js 22", () => {
	template.hasResourceProperties("AWS::Lambda::Function", {
		FunctionName: "inboxpilot-auth-verify",
		Runtime: "nodejs22.x",
		Handler: "index.handler",
	});
});

test("POST /auth/verify route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "POST /auth/verify",
	});
});

test("GET /docs route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "GET /docs",
	});
});

test("GET /connect/gmail route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "GET /connect/gmail",
	});
});

test("GET /auth/gmail/callback route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "GET /auth/gmail/callback",
	});
});

test("GET /keys route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "GET /keys",
	});
});

test("POST /keys route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "POST /keys",
	});
});

test("PATCH /keys route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "PATCH /keys",
	});
});

test("DELETE /keys route exists", () => {
	template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
		RouteKey: "DELETE /keys",
	});
});

test("Lambdas use existing AWSLambdaBasicExecutionRole", () => {
	template.hasResourceProperties("AWS::Lambda::Function", {
		Role: {
			"Fn::Join": [
				"",
				[
					"arn:",
					{ Ref: "AWS::Partition" },
					":iam::",
					{ Ref: "AWS::AccountId" },
					":role/AWSLambdaBasicExecutionRole",
				],
			],
		},
	});
});
