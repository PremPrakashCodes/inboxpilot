const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ApiResponse<T = unknown> {
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
