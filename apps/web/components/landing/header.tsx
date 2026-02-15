import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
	return (
		<header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
			<div className="container mx-auto flex h-16 items-center justify-between px-6">
				<Link href="/" className="text-xl font-bold tracking-tight">
					InboxPilot
				</Link>
				<nav className="flex items-center gap-4">
					<Link
						href="/login"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Login
					</Link>
					<Button asChild size="sm">
						<Link href="/register">Get Started</Link>
					</Button>
				</nav>
			</div>
		</header>
	);
}
