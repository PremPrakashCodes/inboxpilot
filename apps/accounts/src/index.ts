import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { AuthContext, AuthenticatedEvent } from "@inboxpilot/core";
import { db, json, withAuth } from "@inboxpilot/core";

export const handler = withAuth(
	async (_event: AuthenticatedEvent, { userId }: AuthContext) => {
		const result = await db.send(
			new QueryCommand({
				TableName: process.env.ACCOUNTS_TABLE,
				KeyConditionExpression: "userId = :uid",
				ExpressionAttributeValues: { ":uid": userId },
			}),
		);

		const accounts = (result.Items || []).map((item) => ({
			provider: item.provider,
			providerAccountId: item.providerAccountId,
			name: item.name,
			picture: item.picture,
			createdAt: item.createdAt,
		}));

		return json(200, { accounts });
	},
);
