import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, json, parseBody, registerSchema } from "@inboxpilot/core";

export const handler = async (event: { body?: string }) => {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = registerSchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { name, email } = parsed.data;

	const existing = await db.send(
		new GetCommand({ TableName: process.env.USERS_TABLE, Key: { pk: email } }),
	);
	if (existing.Item) return json(409, { error: "User already exists" });

	const now = new Date().toISOString();
	await db.send(
		new PutCommand({
			TableName: process.env.USERS_TABLE,
			Item: { pk: email, name, createdAt: now, updatedAt: now },
		}),
	);

	return json(201, { message: "User registered successfully", email, name });
};
