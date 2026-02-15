import { json, parseBody, registerSchema } from "@inboxpilot/core";
import { createUser, findUser } from "../../services/user";

export const handler = async (event: { body?: string }) => {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = registerSchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { name, email } = parsed.data;

	const existing = await findUser(email);
	if (existing) return json(409, { error: "User already exists" });

	await createUser(email, name);

	return json(201, { message: "User registered successfully", email, name });
};
