import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { InfraStack } from "../lib/infra-stack";

let template: Template;

beforeAll(() => {
  const app = new cdk.App();
  const stack = new InfraStack(app, "TestStack");
  template = Template.fromStack(stack);
});

test("Health Lambda created with Node.js 20", () => {
  template.hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: "inboxpilot-health",
    Runtime: "nodejs20.x",
    Handler: "index.handler",
  });
});

test("Auth Google Lambda created with Node.js 20", () => {
  template.hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: "inboxpilot-auth-google",
    Runtime: "nodejs20.x",
    Handler: "index.handler",
  });
});

test("DynamoDB accounts table created", () => {
  template.hasResourceProperties("AWS::DynamoDB::Table", {
    TableName: "inboxpilot-accounts",
    KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
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

test("DynamoDB policy attached to shared role", () => {
  template.hasResourceProperties("AWS::IAM::RolePolicy", {
    RoleName: "AWSLambdaBasicExecutionRole",
    PolicyName: "inboxpilot-dynamo-access",
  });
});

test("HTTP API created", () => {
  template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
    Name: "InboxPilot API",
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

test("GET /health route exists", () => {
  template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
    RouteKey: "GET /health",
  });
});

test("Auth Register Lambda created with Node.js 20", () => {
  template.hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: "inboxpilot-auth-register",
    Runtime: "nodejs20.x",
    Handler: "index.handler",
  });
});

test("POST /auth/register route exists", () => {
  template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
    RouteKey: "POST /auth/register",
  });
});

test("Auth Login Lambda created with Node.js 20", () => {
  template.hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: "inboxpilot-auth-login",
    Runtime: "nodejs20.x",
    Handler: "index.handler",
  });
});

test("POST /auth/login route exists", () => {
  template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
    RouteKey: "POST /auth/login",
  });
});

test("Auth Verify Lambda created with Node.js 20", () => {
  template.hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: "inboxpilot-auth-verify",
    Runtime: "nodejs20.x",
    Handler: "index.handler",
  });
});

test("POST /auth/verify route exists", () => {
  template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
    RouteKey: "POST /auth/verify",
  });
});

test("GET /auth/google/callback route exists", () => {
  template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
    RouteKey: "GET /auth/google/callback",
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
