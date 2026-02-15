import type * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type * as lambda from "aws-cdk-lib/aws-lambda";

const METHOD_MAP: Record<string, apigwv2.HttpMethod> = {
	GET: apigwv2.HttpMethod.GET,
	POST: apigwv2.HttpMethod.POST,
	PATCH: apigwv2.HttpMethod.PATCH,
	DELETE: apigwv2.HttpMethod.DELETE,
};

// --- Backend API (api.example.com) ---

export interface BackendApiProps {
	lambdas: {
		docs: lambda.Function;
		authRegister: lambda.Function;
		authLogin: lambda.Function;
		authVerify: lambda.Function;
		connectGmail: lambda.Function;
		gmailCallback: lambda.Function;
		accounts: lambda.Function;
		apiKeys: lambda.Function;
	};
}

export function createBackendApi(
	scope: cdk.Stack,
	props: BackendApiProps,
): { httpApi: apigwv2.HttpApi } {
	const httpApi = new apigwv2.HttpApi(scope, "BackendApi", {
		apiName: "InboxPilot Backend",
		description: "Backend gateway for InboxPilot",
		corsPreflight: {
			allowOrigins: ["*"],
			allowMethods: [apigwv2.CorsHttpMethod.ANY],
			allowHeaders: ["Content-Type", "Authorization"],
		},
	});

	const routes: Array<{
		method: string;
		path: string;
		fn: lambda.Function;
		name: string;
	}> = [
		{ method: "GET", path: "/docs", fn: props.lambdas.docs, name: "Docs" },
		{
			method: "POST",
			path: "/auth/register",
			fn: props.lambdas.authRegister,
			name: "AuthRegister",
		},
		{
			method: "POST",
			path: "/auth/login",
			fn: props.lambdas.authLogin,
			name: "AuthLogin",
		},
		{
			method: "POST",
			path: "/auth/verify",
			fn: props.lambdas.authVerify,
			name: "AuthVerify",
		},
		{
			method: "GET",
			path: "/connect/gmail",
			fn: props.lambdas.connectGmail,
			name: "ConnectGmail",
		},
		{
			method: "GET",
			path: "/auth/gmail/callback",
			fn: props.lambdas.gmailCallback,
			name: "GmailCallback",
		},
		{
			method: "GET",
			path: "/accounts",
			fn: props.lambdas.accounts,
			name: "Accounts",
		},
		{
			method: "GET",
			path: "/keys",
			fn: props.lambdas.apiKeys,
			name: "ApiKeysList",
		},
		{
			method: "POST",
			path: "/keys",
			fn: props.lambdas.apiKeys,
			name: "ApiKeysCreate",
		},
		{
			method: "PATCH",
			path: "/keys",
			fn: props.lambdas.apiKeys,
			name: "ApiKeysUpdate",
		},
		{
			method: "DELETE",
			path: "/keys",
			fn: props.lambdas.apiKeys,
			name: "ApiKeysDelete",
		},
	];

	for (const route of routes) {
		httpApi.addRoutes({
			path: route.path,
			methods: [METHOD_MAP[route.method]],
			integration: new integrations.HttpLambdaIntegration(
				`${route.name}Integration`,
				route.fn,
			),
		});
	}

	return { httpApi };
}

// --- Frontend Gateway (example.com) ---

export interface FrontendGatewayProps {
	domainName: apigwv2.DomainName;
	frontend: {
		serverFn: lambda.Function;
		imageFn: lambda.Function;
		staticFn: lambda.Function;
	};
}

export function createFrontendGateway(
	scope: cdk.Stack,
	props: FrontendGatewayProps,
): { httpApi: apigwv2.HttpApi } {
	// Keep construct ID "InboxPilotApi" to preserve existing CloudFormation resource
	const httpApi = new apigwv2.HttpApi(scope, "InboxPilotApi", {
		apiName: "InboxPilot Frontend",
		description: "Frontend gateway for InboxPilot",
		defaultDomainMapping: { domainName: props.domainName },
		defaultIntegration: new integrations.HttpLambdaIntegration(
			"FrontendServerIntegration",
			props.frontend.serverFn,
		),
	});

	httpApi.addRoutes({
		path: "/_next/image",
		methods: [apigwv2.HttpMethod.GET],
		integration: new integrations.HttpLambdaIntegration(
			"FrontendImageIntegration",
			props.frontend.imageFn,
		),
	});

	httpApi.addRoutes({
		path: "/_next/static/{proxy+}",
		methods: [apigwv2.HttpMethod.GET],
		integration: new integrations.HttpLambdaIntegration(
			"FrontendStaticIntegration",
			props.frontend.staticFn,
		),
	});

	return { httpApi };
}
