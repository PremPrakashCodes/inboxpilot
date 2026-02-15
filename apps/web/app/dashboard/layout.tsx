import { DesktopSidebar, MobileSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen">
			<DesktopSidebar />
			<div className="flex flex-1 flex-col overflow-hidden">
				<MobileSidebar />
				<main className="flex-1 overflow-y-auto p-6">{children}</main>
			</div>
		</div>
	);
}
