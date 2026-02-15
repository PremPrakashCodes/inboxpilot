import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { fetchEmails, getConnectedAccounts } from "@/lib/gmail";
import { InboxView } from "./inbox";

export default async function DashboardPage() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const accounts = await getConnectedAccounts(session.user.email);
	const emails =
		accounts.length > 0 ? await fetchEmails(session.user.email) : [];

	return <InboxView emails={emails} hasAccounts={accounts.length > 0} />;
}
