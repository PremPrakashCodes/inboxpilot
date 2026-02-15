import { Mail } from "lucide-react";
import { cookies } from "next/headers";
import { ConnectGmailButton } from "@/components/dashboard/connect-gmail-button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { listAccounts } from "@/lib/api";

export default async function AccountsPage() {
	const cookieStore = await cookies();
	const token = cookieStore.get("inboxpilot_token")?.value ?? "";
	const res = await listAccounts(token);
	const accounts = res.ok ? res.data.accounts : [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Connected Accounts</h1>
					<p className="text-muted-foreground">
						Manage your connected Gmail accounts
					</p>
				</div>
				<ConnectGmailButton />
			</div>

			{accounts.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
					<Mail className="mb-4 h-10 w-10 text-muted-foreground" />
					<p className="text-muted-foreground">No accounts connected yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Connect a Gmail account to get started
					</p>
				</div>
			) : (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Provider</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Connected</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{accounts.map((account) => (
								<TableRow key={account.providerAccountId}>
									<TableCell>
										<Badge variant="secondary">{account.provider}</Badge>
									</TableCell>
									<TableCell className="font-medium">
										{account.providerAccountId}
									</TableCell>
									<TableCell>{account.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(account.createdAt).toLocaleDateString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
