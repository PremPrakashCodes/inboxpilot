"use client";

import { KeyRound, LayoutDashboard, LogOut, Mail, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/dashboard/accounts", label: "Accounts", icon: Mail },
	{ href: "/dashboard/keys", label: "API Keys", icon: KeyRound },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();

	return (
		<nav className="flex flex-col gap-1">
			{navItems.map((item) => {
				const isActive =
					pathname === item.href ||
					(item.href !== "/dashboard" && pathname.startsWith(item.href));
				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
							isActive
								? "bg-accent text-accent-foreground font-medium"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						}`}
					>
						<item.icon className="h-4 w-4" />
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}

function LogoutButton() {
	const router = useRouter();

	function handleLogout() {
		// biome-ignore lint/suspicious/noDocumentCookie: simple cookie deletion for logout
		document.cookie =
			"inboxpilot_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		router.push("/login");
	}

	return (
		<button
			type="button"
			onClick={handleLogout}
			className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
		>
			<LogOut className="h-4 w-4" />
			Logout
		</button>
	);
}

export function DesktopSidebar() {
	return (
		<aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card">
			<div className="flex h-14 items-center px-4">
				<Link href="/" className="text-lg font-bold">
					InboxPilot
				</Link>
			</div>
			<Separator />
			<div className="flex flex-1 flex-col justify-between p-4">
				<NavLinks />
				<LogoutButton />
			</div>
		</aside>
	);
}

export function MobileSidebar() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex h-14 items-center border-b px-4 md:hidden">
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild>
					<Button variant="ghost" size="icon">
						<Menu className="h-5 w-5" />
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="w-60 p-0">
					<SheetTitle className="sr-only">Navigation</SheetTitle>
					<div className="flex h-14 items-center px-4">
						<Link
							href="/"
							className="text-lg font-bold"
							onClick={() => setOpen(false)}
						>
							InboxPilot
						</Link>
					</div>
					<Separator />
					<div className="flex flex-1 flex-col justify-between p-4">
						<NavLinks onNavigate={() => setOpen(false)} />
						<LogoutButton />
					</div>
				</SheetContent>
			</Sheet>
			<span className="ml-3 text-lg font-bold">InboxPilot</span>
		</div>
	);
}
