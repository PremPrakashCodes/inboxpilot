import Link from "next/link";

export function Footer() {
	return (
		<footer className="border-t border-border/40 px-6 py-8">
			<div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
				<p className="text-sm text-muted-foreground">
					InboxPilot — Open source email management API
				</p>
				<nav className="flex gap-6">
					<Link
						href="https://github.com/prem-prakash-portfolio/inboxpilot"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						GitHub
					</Link>
					<Link
						href="/docs"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						API Docs
					</Link>
				</nav>
			</div>
		</footer>
	);
}
