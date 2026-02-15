import {
	Archive,
	FileText,
	Inbox,
	LogOut,
	Mail,
	Send,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar";

const navItems = [
	{ title: "Inbox", icon: Inbox, href: "/dashboard", badge: "12" },
	{ title: "Sent", icon: Send, href: "/dashboard/sent", badge: null },
	{ title: "Drafts", icon: FileText, href: "/dashboard/drafts", badge: "2" },
	{ title: "Archive", icon: Archive, href: "/dashboard/archive", badge: null },
	{ title: "Trash", icon: Trash2, href: "/dashboard/trash", badge: null },
];

const connectedAccounts = [
	{ email: "john@gmail.com", provider: "Gmail" },
	{ email: "john@outlook.com", provider: "Outlook" },
];

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session?.user) redirect("/login");

	const initials = session.user.name
		? session.user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
		: (session.user.email?.charAt(0).toUpperCase() ?? "?");

	return (
		<SidebarProvider>
			<Sidebar>
				<SidebarHeader>
					<Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
						<Mail className="size-5" />
						<span className="text-lg font-semibold tracking-tight">
							InboxPilot
						</span>
					</Link>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{navItems.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild>
											<Link href={item.href}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
										{item.badge && (
											<SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
										)}
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<Separator />

					<SidebarGroup>
						<SidebarGroupLabel>Connected Accounts</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{connectedAccounts.map((account) => (
									<SidebarMenuItem key={account.email}>
										<SidebarMenuButton>
											<span className="size-2 rounded-full bg-green-500" />
											<span className="truncate text-xs">{account.email}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<Link
											href="/dashboard/accounts"
											className="text-muted-foreground"
										>
											<span className="size-2" />
											<span className="text-xs">+ Connect account</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter>
					<div className="flex items-center gap-2 px-2">
						<Avatar className="size-7">
							<AvatarFallback className="text-xs">{initials}</AvatarFallback>
						</Avatar>
						<div className="flex-1 truncate text-sm">{session.user.email}</div>
						<form
							action={async () => {
								"use server";
								await signOut({ redirectTo: "/" });
							}}
						>
							<Button variant="ghost" size="icon-xs" type="submit">
								<LogOut className="size-3.5" />
							</Button>
						</form>
					</div>
				</SidebarFooter>
			</Sidebar>

			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
