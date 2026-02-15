import type { AuthContext, AuthenticatedEvent } from "@inboxpilot/core";
import { json, withAuth } from "@inboxpilot/core";
import { generateConsentUrl } from "../../services/gmail";

export const handler = withAuth(
	async (_event: AuthenticatedEvent, { userId }: AuthContext) => {
		const url = generateConsentUrl(userId);
		return json(200, { url });
	},
);
