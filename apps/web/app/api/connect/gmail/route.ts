import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGmailConnectUrl } from "@/lib/gmail";

export async function GET() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const url = getGmailConnectUrl(session.user.email);
	redirect(url);
}
