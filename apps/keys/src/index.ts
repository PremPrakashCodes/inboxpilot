import crypto from "node:crypto";
import {
	DeleteCommand,
	GetCommand,
	PutCommand,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
	type AuthContext,
	type AuthenticatedEvent,
	apiKeyEmailTemplate,
	createKeySchema,
	db,
	deleteKeySchema,
	EXPIRY_OPTIONS,
	generateSessionToken,
	json,
	parseBody,
	sendEmail,
	updateKeySchema,
	withAuth,
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

async function createKey(event: AuthenticatedEvent, userId: string) {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = createKeySchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { name, expiresIn } = parsed.data;
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

	try {
		await sendEmail({
			from: process.env.EMAIL_FROM || "InboxPilot <onboarding@resend.dev>",
			to: [userId],
			subject: `Your InboxPilot API Key — ${name}`,
			html: apiKeyEmailTemplate(token, name),
		});
	} catch {
		return json(500, {
			error: "Failed to send API key email. Please try again.",
		});
	}

	return json(201, {
		message: "API key created and sent to your email",
		keyId,
		name,
		expiresAt,
	});
}

async function listKeys(_event: AuthenticatedEvent, userId: string) {
	const result = await db.send(
		new QueryCommand({
			TableName: process.env.APIKEYS_TABLE,
			IndexName: "userId-index",
			KeyConditionExpression: "userId = :uid",
			ExpressionAttributeValues: { ":uid": userId },
		}),
	);

	const now = Math.floor(Date.now() / 1000);
	const keys = (result.Items || [])
		.filter((item) => !item.pk.startsWith("keyref#"))
		.filter((item) => item.ttl === 0 || item.ttl > now)
		.map((item) => ({
			keyId: item.keyId,
			name: item.name,
			prefix: `${item.pk.slice(0, 8)}...${item.pk.slice(-4)}`,
			createdAt: item.createdAt,
			expiresAt: item.expiresAt || "never",
		}));

	return json(200, { keys });
}

async function updateKey(event: AuthenticatedEvent, userId: string) {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = updateKeySchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { keyId, name, expiresIn } = parsed.data;

	// Look up token by keyId
	const ref = await db.send(
		new GetCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: `keyref#${keyId}` },
		}),
	);
	if (!ref.Item || ref.Item.userId !== userId) {
		return json(404, { error: "API key not found" });
	}

	const updates: string[] = [];
	const names: Record<string, string> = {};
	const values: Record<string, unknown> = {};

	if (name) {
		updates.push("#n = :name");
		names["#n"] = "name";
		values[":name"] = name;
	}
	if (expiresIn) {
		const { ttl, expiresAt } = resolveTtl(expiresIn);
		updates.push("expiresAt = :expiresAt, #t = :ttl");
		names["#t"] = "ttl";
		values[":expiresAt"] = expiresAt;
		values[":ttl"] = ttl;
	}

	if (updates.length === 0) {
		return json(400, { error: "No fields to update" });
	}

	await db.send(
		new UpdateCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: ref.Item.token },
			UpdateExpression: `SET ${updates.join(", ")}`,
			ExpressionAttributeNames: names,
			ExpressionAttributeValues: values,
		}),
	);

	return json(200, { message: "API key updated", keyId });
}

async function deleteKey(event: AuthenticatedEvent, userId: string) {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = deleteKeySchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { keyId } = parsed.data;

	// Look up token by keyId
	const ref = await db.send(
		new GetCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: `keyref#${keyId}` },
		}),
	);
	if (!ref.Item || ref.Item.userId !== userId) {
		return json(404, { error: "API key not found" });
	}

	// Delete both items
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

	return json(200, { message: "API key deleted", keyId });
}

export const handler = withAuth(
	async (event: AuthenticatedEvent, { userId }: AuthContext) => {
		const method = event.requestContext?.http?.method;
		switch (method) {
			case "POST":
				return createKey(event, userId);
			case "GET":
				return listKeys(event, userId);
			case "PATCH":
				return updateKey(event, userId);
			case "DELETE":
				return deleteKey(event, userId);
			default:
				return json(405, { error: "Method not allowed" });
		}
	},
);
