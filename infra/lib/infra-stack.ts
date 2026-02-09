import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as path from "path";

const DOMAIN = process.env.INBOXPILOT_DOMAIN || "inboxpilot.premprakash.dev";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use existing shared Lambda execution role
    const lambdaRole = iam.Role.fromRoleName(
      this,
      "LambdaExecutionRole",
      "AWSLambdaBasicExecutionRole",
    );

    // ACM certificate (DNS validation via Cloudflare)
    const certificate = new acm.Certificate(this, "InboxPilotCert", {
      domainName: DOMAIN,
      validation: acm.CertificateValidation.fromDns(),
    });

    // Custom domain for API Gateway
    const domainName = new apigwv2.DomainName(this, "InboxPilotDomain", {
      domainName: DOMAIN,
      certificate,
    });

    // DynamoDB tables
    const accountsTable = new dynamodb.Table(this, "InboxPilotAccounts", {
      tableName: "inboxpilot-accounts",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const usersTable = new dynamodb.Table(this, "InboxPilotUsers", {
      tableName: "inboxpilot-users",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const apikeysTable = new dynamodb.Table(this, "InboxPilotApikeys", {
      tableName: "inboxpilot-apikeys",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Health Lambda
    const healthFn = new lambda.Function(this, "InboxPilotHealthFn", {
      functionName: "inboxpilot-health",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../apps/health")),
      role: lambdaRole,
    });

    // Google OAuth callback Lambda
    const authGoogleFn = new lambda.Function(this, "InboxPilotAuthGoogleFn", {
      functionName: "inboxpilot-auth-google",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../apps/auth/google"),
      ),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      environment: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
        GOOGLE_REDIRECT_URI: `https://${DOMAIN}/auth/google/callback`,
        ACCOUNTS_TABLE: accountsTable.tableName,
        USERS_TABLE: usersTable.tableName,
        APIKEYS_TABLE: apikeysTable.tableName,
      },
    });

    // Register Lambda
    const authRegisterFn = new lambda.Function(this, "InboxPilotAuthRegisterFn", {
      functionName: "inboxpilot-auth-register",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../apps/auth/register"),
      ),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
    });

    // Login Lambda (sends OTP)
    const authLoginFn = new lambda.Function(this, "InboxPilotAuthLoginFn", {
      functionName: "inboxpilot-auth-login",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../apps/auth/login"),
      ),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      environment: {
        RESEND_API_KEY: process.env.RESEND_API_KEY || "",
        USERS_TABLE: usersTable.tableName,
        APIKEYS_TABLE: apikeysTable.tableName,
      },
    });

    // Verify Lambda (verifies OTP, returns API key)
    const authVerifyFn = new lambda.Function(this, "InboxPilotAuthVerifyFn", {
      functionName: "inboxpilot-auth-verify",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../apps/auth/verify"),
      ),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      environment: {
        APIKEYS_TABLE: apikeysTable.tableName,
      },
    });

    // Grant DynamoDB access to shared role (can't use grantWriteData on imported roles)
    new iam.CfnRolePolicy(this, "InboxPilotDynamoPolicy", {
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
            Resource: [accountsTable.tableArn, usersTable.tableArn, apikeysTable.tableArn],
          },
        ],
      },
    });

    // HTTP API (v2)
    const api = new apigwv2.HttpApi(this, "InboxPilotApi", {
      apiName: "InboxPilot API",
      description: "Public API for InboxPilot",
      defaultDomainMapping: {
        domainName,
      },
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // /health route
    api.addRoutes({
      path: "/health",
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "HealthIntegration",
        healthFn,
      ),
    });

    // /auth/register route
    api.addRoutes({
      path: "/auth/register",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "AuthRegisterIntegration",
        authRegisterFn,
      ),
    });

    // /auth/login route
    api.addRoutes({
      path: "/auth/login",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "AuthLoginIntegration",
        authLoginFn,
      ),
    });

    // /auth/verify route
    api.addRoutes({
      path: "/auth/verify",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "AuthVerifyIntegration",
        authVerifyFn,
      ),
    });

    // /auth/google/callback route
    api.addRoutes({
      path: "/auth/google/callback",
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "AuthGoogleIntegration",
        authGoogleFn,
      ),
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: `https://${DOMAIN}`,
    });

    new cdk.CfnOutput(this, "ApiGatewayDomainTarget", {
      value: domainName.regionalDomainName,
      description: "Add this as CNAME target in Cloudflare for " + DOMAIN,
    });

    new cdk.CfnOutput(this, "CertificateArn", {
      value: certificate.certificateArn,
    });
  }
}
