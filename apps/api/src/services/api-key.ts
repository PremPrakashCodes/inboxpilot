import crypto from "node:crypto";
import {
	DeleteCommand,
	GetCommand,
	PutCommand,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
	API_KEY_TTL_SECONDS,
	apiKeyEmailTemplate,
	db,
	EXPIRY_OPTIONS,
	generateSessionToken,
	sendEmail,
} from "@inboxpilot/core";

function resolveTtl(expiresIn: string | number): {
	ttl: number;
	expiresAt: string;
} {
	let seconds: number;
	if (typeof expiresIn === "string") {
		seconds = EXPIRY_OPTIONS[expiresIn];
	} else {
		seconds = expiresIn * 24 * 60 * 60;
	}
	if (seconds === 0) {
		return { ttl: 0, expiresAt: "never" };
	}
	return {
		ttl: Math.floor(Date.now() / 1000) + seconds,
		expiresAt: new Date(Date.now() + seconds * 1000).toISOString(),
	};
}

export async function createDefaultApiKey(email: string) {
	const token = generateSessionToken();
	const keyId = crypto.randomUUID();
	const name = "Default";
	const now = new Date().toISOString();
	const ttl = Math.floor(Date.now() / 1000) + API_KEY_TTL_SECONDS;
	const expiresAt = new Date(
		Date.now() + API_KEY_TTL_SECONDS * 1000,
	).toISOString();

	await db.send(
		new PutCommand({
			TableName: process.env.APIKEYS_TABLE,
			Item: {
				pk: token,
				userId: email,
				keyId,
				name,
				createdAt: now,
				expiresAt,
				ttl,
			},
		}),
	);
	await db.send(
		new PutCommand({
			TableName: process.env.APIKEYS_TABLE,
			Item: { pk: `keyref#${keyId}`, token, userId: email },
		}),
	);

	await sendEmail({
		from: process.env.EMAIL_FROM || "InboxPilot <onboarding@resend.dev>",
		to: [email],
		subject: "Your InboxPilot API Key",
		html: apiKeyEmailTemplate(token, name),
	});
}

export async function createApiKey(
	userId: string,
	name: string,
	expiresIn: string | number,
) {
	const { ttl, expiresAt } = resolveTtl(expiresIn);
	const token = generateSessionToken();
	const keyId = crypto.randomUUID();
	const now = new Date().toISOString();

	await db.send(
		new PutCommand({
			TableName: process.env.APIKEYS_TABLE,
			Item: { pk: token, userId, keyId, name, createdAt: now, expiresAt, ttl },
		}),
	);
	await db.send(
		new PutCommand({
			TableName: process.env.APIKEYS_TABLE,
			Item: { pk: `keyref#${keyId}`, token, userId },
		}),
	);

	await sendEmail({
		from: process.env.EMAIL_FROM || "InboxPilot <onboarding@resend.dev>",
		to: [userId],
		subject: `Your InboxPilot API Key — ${name}`,
		html: apiKeyEmailTemplate(token, name),
	});

	return { keyId, name, expiresAt };
}

export async function listApiKeys(userId: string) {
	const result = await db.send(
		new QueryCommand({
			TableName: process.env.APIKEYS_TABLE,
			IndexName: "userId-index",
			KeyConditionExpression: "userId = :uid",
			ExpressionAttributeValues: { ":uid": userId },
		}),
	);

	const now = Math.floor(Date.now() / 1000);
	return (result.Items || [])
		.filter((item) => !item.pk.startsWith("keyref#"))
		.filter((item) => item.ttl === 0 || item.ttl > now)
		.map((item) => ({
			keyId: item.keyId,
			name: item.name,
			prefix: `${item.pk.slice(0, 8)}...${item.pk.slice(-4)}`,
			createdAt: item.createdAt,
			expiresAt: item.expiresAt || "never",
		}));
}

export async function updateApiKey(
	userId: string,
	keyId: string,
	fields: { name?: string; expiresIn?: string | number },
) {
	const ref = await db.send(
		new GetCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: `keyref#${keyId}` },
		}),
	);
	if (!ref.Item || ref.Item.userId !== userId) return null;

	const updates: string[] = [];
	const names: Record<string, string> = {};
	const values: Record<string, unknown> = {};

	if (fields.name) {
		updates.push("#n = :name");
		names["#n"] = "name";
		values[":name"] = fields.name;
	}
	if (fields.expiresIn) {
		const { ttl, expiresAt } = resolveTtl(fields.expiresIn);
		updates.push("expiresAt = :expiresAt, #t = :ttl");
		names["#t"] = "ttl";
		values[":expiresAt"] = expiresAt;
		values[":ttl"] = ttl;
	}

	if (updates.length === 0) return "no_fields";

	await db.send(
		new UpdateCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: ref.Item.token },
			UpdateExpression: `SET ${updates.join(", ")}`,
			ExpressionAttributeNames: names,
			ExpressionAttributeValues: values,
		}),
	);

	return keyId;
}

export async function deleteApiKey(userId: string, keyId: string) {
	const ref = await db.send(
		new GetCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: `keyref#${keyId}` },
		}),
	);
	if (!ref.Item || ref.Item.userId !== userId) return null;

	await db.send(
		new DeleteCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: ref.Item.token },
		}),
	);
	await db.send(
		new DeleteCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: `keyref#${keyId}` },
		}),
	);

	return keyId;
}
