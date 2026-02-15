import type { AuthenticatedEvent } from "@inboxpilot/core";
import { json } from "@inboxpilot/core";
import { exchangeCodeAndSaveAccount } from "../../services/gmail";

export const handler = async (event: AuthenticatedEvent) => {
	const { code, state } = event.queryStringParameters ?? {};
	if (!code || !state) return json(400, { error: "Missing OAuth parameters" });

	let userId: string;
	try {
		userId = JSON.parse(Buffer.from(state, "base64url").toString()).userId;
	} catch {
		return json(400, { error: "Invalid state" });
	}

	try {
		const result = await exchangeCodeAndSaveAccount(code, userId);
		return json(200, {
			message: "Gmail connected successfully",
			...result,
		});
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to connect Gmail";
		return json(400, { error: message });
	}
};
