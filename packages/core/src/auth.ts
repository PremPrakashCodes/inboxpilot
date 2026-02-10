import crypto from "node:crypto";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "./db";

export function generateSessionToken(): string {
	return crypto.randomUUID();
}

export function generateOTP(): string {
	return String(crypto.randomInt(100000, 999999));
}

export async function getSessionUser(token: string): Promise<string | null> {
	const result = await db.send(
		new GetCommand({
			TableName: process.env.APIKEYS_TABLE,
			Key: { pk: token },
		}),
	);
	if (!result.Item || result.Item.ttl < Math.floor(Date.now() / 1000)) {
		return null;
	}
	return result.Item.userId;
}

export function parseBearerToken(event: {
	headers?: Record<string, string>;
}): string | null {
	const header = event.headers?.authorization || event.headers?.Authorization;
	if (!header || !header.startsWith("Bearer ")) return null;
	return header.slice(7);
}
