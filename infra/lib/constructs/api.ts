import type * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type * as acm from "aws-cdk-lib/aws-certificatemanager";
import type * as lambda from "aws-cdk-lib/aws-lambda";

export interface ApiProps {
	domain: string;
	certificate: acm.Certificate;
	lambdas: {
		docs: lambda.Function;
		authRegister: lambda.Function;
		authLogin: lambda.Function;
		authVerify: lambda.Function;
		connectGmail: lambda.Function;
		apiKeys: lambda.Function;
	};
}

export interface ApiResult {
	httpApi: apigwv2.HttpApi;
	domainName: apigwv2.DomainName;
}

const METHOD_MAP: Record<string, apigwv2.HttpMethod> = {
	GET: apigwv2.HttpMethod.GET,
	POST: apigwv2.HttpMethod.POST,
	PATCH: apigwv2.HttpMethod.PATCH,
	DELETE: apigwv2.HttpMethod.DELETE,
};

export function createApi(scope: cdk.Stack, props: ApiProps): ApiResult {
	const domainName = new apigwv2.DomainName(scope, "InboxPilotDomain", {
		domainName: props.domain,
		certificate: props.certificate,
	});

	const httpApi = new apigwv2.HttpApi(scope, "InboxPilotApi", {
		apiName: "InboxPilot API",
		description: "Public API for InboxPilot",
		defaultDomainMapping: { domainName },
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
			fn: props.lambdas.connectGmail,
			name: "GmailCallback",
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

	return { httpApi, domainName };
}
