import { json, loginSchema, parseBody } from "@inboxpilot/core";
import { createAndSendOtp } from "../../services/otp";
import { findUser } from "../../services/user";

export const handler = async (event: { body?: string }) => {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { email } = parsed.data;

	const user = await findUser(email);
	if (!user)
		return json(404, { error: "User not found. Please register first." });

	try {
		await createAndSendOtp(email);
	} catch {
		return json(500, { error: "Failed to send email. Please try again." });
	}

	return json(200, { message: "OTP sent to your email", email });
};
