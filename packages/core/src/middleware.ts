import { getSessionUser, parseBearerToken } from "./auth";
import { json } from "./response";

export interface AuthenticatedEvent {
	headers?: Record<string, string>;
	body?: string;
	queryStringParameters?: Record<string, string>;
	requestContext?: { http?: { method: string; path: string } };
	[key: string]: unknown;
}

export interface AuthContext {
	userId: string;
}

type Handler = (event: AuthenticatedEvent) => Promise<unknown>;
type AuthHandler = (
	event: AuthenticatedEvent,
	auth: AuthContext,
) => Promise<unknown>;

export function withAuth(handler: AuthHandler): Handler {
	return async (event) => {
		const token = parseBearerToken(event);
		if (!token) {
			return json(401, {
				error: "Authorization header required (Bearer <token>)",
			});
		}

		const userId = await getSessionUser(token);
		if (!userId) {
			return json(401, { error: "Invalid or expired session token" });
		}

		return handler(event, { userId });
	};
}
