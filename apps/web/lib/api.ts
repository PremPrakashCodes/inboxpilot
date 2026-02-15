const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ApiResponse<T = unknown> {
	ok: boolean;
	status: number;
	data: T;
}

async function request<T>(
	path: string,
	options?: RequestInit,
): Promise<ApiResponse<T>> {
	const res = await fetch(`${API_URL}${path}`, {
		headers: { "Content-Type": "application/json" },
		...options,
	});
	const data = await res.json();
	return { ok: res.ok, status: res.status, data };
}

function authRequest<T>(
	path: string,
	token: string,
	options?: RequestInit,
): Promise<ApiResponse<T>> {
	return request<T>(path, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...options?.headers,
		},
	});
}

// Auth
export function register(name: string, email: string) {
	return request<{ message: string; email: string; name: string }>(
		"/auth/register",
		{ method: "POST", body: JSON.stringify({ name, email }) },
	);
}

export function login(email: string) {
	return request<{ message: string; email: string }>("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email }),
	});
}

export function verify(email: string, otp: string) {
	return request<{ message: string; email: string }>("/auth/verify", {
		method: "POST",
		body: JSON.stringify({ email, otp }),
	});
}

// Accounts
export interface AccountInfo {
	provider: string;
	providerAccountId: string;
	name: string;
	picture: string;
	createdAt: string;
}

export function listAccounts(token: string) {
	return authRequest<{ accounts: AccountInfo[] }>("/accounts", token);
}

export function connectGmail(token: string) {
	return authRequest<{ url: string }>("/connect/gmail", token);
}

// API Keys
export interface ApiKeyInfo {
	keyId: string;
	name: string;
	prefix: string;
	createdAt: string;
	expiresAt: string;
}

export function listKeys(token: string) {
	return authRequest<{ keys: ApiKeyInfo[] }>("/keys", token);
}

export function createKey(
	token: string,
	name: string,
	expiresIn: string | number,
) {
	return authRequest<{
		message: string;
		keyId: string;
		name: string;
		expiresAt: string;
	}>("/keys", token, {
		method: "POST",
		body: JSON.stringify({ name, expiresIn }),
	});
}

export function updateKey(
	token: string,
	keyId: string,
	data: { name?: string; expiresIn?: string | number },
) {
	return authRequest<{ message: string; keyId: string }>("/keys", token, {
		method: "PATCH",
		body: JSON.stringify({ keyId, ...data }),
	});
}

export function deleteKey(token: string, keyId: string) {
	return authRequest<{ message: string; keyId: string }>("/keys", token, {
		method: "DELETE",
		body: JSON.stringify({ keyId }),
	});
}
