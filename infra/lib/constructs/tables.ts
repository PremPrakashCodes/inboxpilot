import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface TablesResult {
	accounts: dynamodb.Table;
	users: dynamodb.Table;
	apikeys: dynamodb.Table;
}

export function createTables(scope: cdk.Stack): TablesResult {
	const accounts = new dynamodb.Table(scope, "InboxPilotAccounts", {
		tableName: "inboxpilot-accounts",
		partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
		billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
		removalPolicy: cdk.RemovalPolicy.RETAIN,
	});

	const users = new dynamodb.Table(scope, "InboxPilotUsers", {
		tableName: "inboxpilot-users",
		partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
		billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
		removalPolicy: cdk.RemovalPolicy.RETAIN,
	});

	const apikeys = new dynamodb.Table(scope, "InboxPilotApikeys", {
		tableName: "inboxpilot-apikeys",
		partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
		billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
		timeToLiveAttribute: "ttl",
		removalPolicy: cdk.RemovalPolicy.RETAIN,
	});

	return { accounts, users, apikeys };
}
