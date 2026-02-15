import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center px-6">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Welcome back</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Enter your email to receive a one-time login code
					</p>
				</div>
				<LoginForm />
				<p className="text-center text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link href="/register" className="underline hover:text-foreground">
						Register
					</Link>
				</p>
			</div>
		</div>
	);
}
