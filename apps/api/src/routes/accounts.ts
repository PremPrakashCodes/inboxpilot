import type { AuthContext, AuthenticatedEvent } from "@inboxpilot/core";
import { json, withAuth } from "@inboxpilot/core";
import { listAccounts } from "../services/account";

export const handler = withAuth(
	async (_event: AuthenticatedEvent, { userId }: AuthContext) => {
		const accounts = await listAccounts(userId);
		return json(200, { accounts });
	},
);
