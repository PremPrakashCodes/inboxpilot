import { json, parseBody, verifySchema } from "@inboxpilot/core";
import { createDefaultApiKey } from "../../services/api-key";
import { verifyOtp } from "../../services/otp";

export const handler = async (event: { body?: string }) => {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = verifySchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { email, otp } = parsed.data;

	const result = await verifyOtp(email, otp);
	if (!result.valid) {
		return json(401, { error: result.error });
	}

	try {
		await createDefaultApiKey(email);
	} catch {
		return json(500, {
			error: "Failed to send API key email. Please try again.",
		});
	}

	return json(200, { message: "API key sent to your email", email });
};
