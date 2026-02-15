import { type NextRequest, NextResponse } from "next/server";
import { exchangeCodeAndSaveAccount } from "@/lib/gmail";

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const code = searchParams.get("code");
	const state = searchParams.get("state");

	if (!code || !state) {
		return NextResponse.redirect(
			new URL("/dashboard?error=missing_params", request.url),
		);
	}

	let userId: string;
	try {
		userId = JSON.parse(Buffer.from(state, "base64url").toString()).userId;
	} catch {
		return NextResponse.redirect(
			new URL("/dashboard?error=invalid_state", request.url),
		);
	}

	try {
		await exchangeCodeAndSaveAccount(code, userId);
		return NextResponse.redirect(
			new URL("/dashboard?connected=gmail", request.url),
		);
	} catch {
		return NextResponse.redirect(
			new URL("/dashboard?error=gmail_connect_failed", request.url),
		);
	}
}
