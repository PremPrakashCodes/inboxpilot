const steps = [
	{
		step: "1",
		title: "Register",
		description: "Sign up with your email. No passwords needed.",
	},
	{
		step: "2",
		title: "Connect Gmail",
		description: "Link your Gmail account securely via Google OAuth.",
	},
	{
		step: "3",
		title: "Manage via API",
		description:
			"Use your API key to read, send, and manage emails programmatically.",
	},
];

export function HowItWorks() {
	return (
		<section className="border-t border-border/40 px-6 py-20">
			<div className="container mx-auto">
				<h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
					How it works
				</h2>
				<div className="grid gap-8 md:grid-cols-3">
					{steps.map((item) => (
						<div key={item.step} className="text-center">
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
								{item.step}
							</div>
							<h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
							<p className="text-muted-foreground">{item.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
