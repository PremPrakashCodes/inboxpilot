import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "@inboxpilot/core";

export async function findUser(email: string) {
	const result = await db.send(
		new GetCommand({ TableName: process.env.USERS_TABLE, Key: { pk: email } }),
	);
	return result.Item ?? null;
}

export async function createUser(email: string, name: string) {
	const now = new Date().toISOString();
	await db.send(
		new PutCommand({
			TableName: process.env.USERS_TABLE,
			Item: { pk: email, name, createdAt: now, updatedAt: now },
		}),
	);
}
