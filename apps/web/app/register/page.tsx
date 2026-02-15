import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
	return (
		<div className="flex min-h-screen items-center justify-center px-6">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Create an account</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Enter your details to get started with InboxPilot
					</p>
				</div>
				<RegisterForm />
				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href="/login" className="underline hover:text-foreground">
						Login
					</Link>
				</p>
			</div>
		</div>
	);
}
