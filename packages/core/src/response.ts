const headers = { "Content-Type": "application/json" };

export function json(statusCode: number, data: unknown) {
	return { statusCode, headers, body: JSON.stringify(data) };
}

export function parseBody(event: {
	body?: string;
}): Record<string, unknown> | null {
	try {
		return JSON.parse(event.body || "{}");
	} catch {
		return null;
	}
}
