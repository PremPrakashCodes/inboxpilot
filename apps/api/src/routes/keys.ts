import type { AuthContext, AuthenticatedEvent } from "@inboxpilot/core";
import {
	createKeySchema,
	deleteKeySchema,
	json,
	parseBody,
	updateKeySchema,
	withAuth,
} from "@inboxpilot/core";
import {
	createApiKey,
	deleteApiKey,
	listApiKeys,
	updateApiKey,
} from "../services/api-key";

async function handleCreate(event: AuthenticatedEvent, userId: string) {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = createKeySchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}

	try {
		const result = await createApiKey(
			userId,
			parsed.data.name,
			parsed.data.expiresIn,
		);
		return json(201, {
			message: "API key created and sent to your email",
			...result,
		});
	} catch {
		return json(500, {
			error: "Failed to send API key email. Please try again.",
		});
	}
}

async function handleList(_event: AuthenticatedEvent, userId: string) {
	const keys = await listApiKeys(userId);
	return json(200, { keys });
}

async function handleUpdate(event: AuthenticatedEvent, userId: string) {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = updateKeySchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { keyId, name, expiresIn } = parsed.data;

	const result = await updateApiKey(userId, keyId, { name, expiresIn });
	if (result === null) return json(404, { error: "API key not found" });
	if (result === "no_fields")
		return json(400, { error: "No fields to update" });

	return json(200, { message: "API key updated", keyId });
}

async function handleDelete(event: AuthenticatedEvent, userId: string) {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = deleteKeySchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}

	const result = await deleteApiKey(userId, parsed.data.keyId);
	if (result === null) return json(404, { error: "API key not found" });

	return json(200, { message: "API key deleted", keyId: parsed.data.keyId });
}

export const handler = withAuth(
	async (event: AuthenticatedEvent, { userId }: AuthContext) => {
		const method = event.requestContext?.http?.method;
		switch (method) {
			case "POST":
				return handleCreate(event, userId);
			case "GET":
				return handleList(event, userId);
			case "PATCH":
				return handleUpdate(event, userId);
			case "DELETE":
				return handleDelete(event, userId);
			default:
				return json(405, { error: "Method not allowed" });
		}
	},
);
