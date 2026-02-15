import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "@inboxpilot/core";

export async function listAccounts(userId: string) {
	const result = await db.send(
		new QueryCommand({
			TableName: process.env.ACCOUNTS_TABLE,
			KeyConditionExpression: "userId = :uid",
			ExpressionAttributeValues: { ":uid": userId },
		}),
	);

	return (result.Items || []).map((item) => ({
		provider: item.provider,
		providerAccountId: item.providerAccountId,
		name: item.name,
		picture: item.picture,
		createdAt: item.createdAt,
	}));
}
