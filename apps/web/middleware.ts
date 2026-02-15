import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard"];

export function middleware(request: NextRequest) {
	const token = request.cookies.get("inboxpilot_token")?.value;
	const { pathname } = request.nextUrl;

	const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

	if (isProtected && !token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
