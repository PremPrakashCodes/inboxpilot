import * as lambda from "aws-cdk-lib/aws-lambda";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cdk from "aws-cdk-lib";

export interface ApiProps {
  domain: string;
  certificate: acm.Certificate;
  lambdas: {
    health: lambda.Function;
    authRegister: lambda.Function;
    authLogin: lambda.Function;
    authVerify: lambda.Function;
    connectGmail: lambda.Function;
  };
}

export interface ApiResult {
  httpApi: apigwv2.HttpApi;
  domainName: apigwv2.DomainName;
}

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

  const routes: Array<{ method: "GET" | "POST"; path: string; fn: lambda.Function; name: string }> = [
    { method: "GET", path: "/health", fn: props.lambdas.health, name: "Health" },
    { method: "POST", path: "/auth/register", fn: props.lambdas.authRegister, name: "AuthRegister" },
    { method: "POST", path: "/auth/login", fn: props.lambdas.authLogin, name: "AuthLogin" },
    { method: "POST", path: "/auth/verify", fn: props.lambdas.authVerify, name: "AuthVerify" },
    { method: "GET", path: "/connect/gmail", fn: props.lambdas.connectGmail, name: "ConnectGmail" },
  ];

  for (const route of routes) {
    const httpMethod = route.method === "GET" ? apigwv2.HttpMethod.GET : apigwv2.HttpMethod.POST;
    httpApi.addRoutes({
      path: route.path,
      methods: [httpMethod],
      integration: new integrations.HttpLambdaIntegration(`${route.name}Integration`, route.fn),
    });
  }

  return { httpApi, domainName };
}
