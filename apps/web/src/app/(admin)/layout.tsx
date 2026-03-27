import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

const ADMIN_ROLES = [
  "admin",
  "pm",
  "creative",
  "operations",
  "support",
  "finance",
  "commercial",
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!ADMIN_ROLES.includes(session.role)) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-void">
      <Sidebar session={session} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar session={session} />
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
