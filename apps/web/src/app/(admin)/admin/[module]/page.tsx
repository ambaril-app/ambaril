import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Users,
  ShoppingCart,
  Package,
  MessageCircle,
  LayoutDashboard,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { MODULES } from "@ambaril/shared/constants";

// Map icon names to Lucide components
const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  Users,
  ShoppingCart,
  Package,
  MessageCircle,
  LayoutDashboard,
};

interface ModulePlaceholderPageProps {
  params: Promise<{ module: string }>;
}

export default async function ModulePlaceholderPage({
  params,
}: ModulePlaceholderPageProps) {
  const { module: moduleSlug } = await params;

  const mod = MODULES.find((m) => m.id === moduleSlug);

  if (!mod || mod.status === "disabled") {
    notFound();
  }

  // Active modules should never reach here — Next.js gives priority to
  // specific routes (e.g., /admin/creators/) over this catch-all.
  // But just in case, redirect to the module's base path.
  if (mod.status === "active") {
    const { redirect } = await import("next/navigation");
    redirect(mod.basePath);
  }

  const Icon = ICON_MAP[mod.icon];

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-surface text-text-ghost">
        {Icon ? <Icon size={32} /> : <Clock size={32} />}
      </div>

      <h1 className="mt-6 text-xl font-medium text-text-bright">{mod.label}</h1>

      <p className="mt-2 max-w-sm text-sm text-text-ghost">
        Este módulo estará disponível em breve. Estamos trabalhando para trazer{" "}
        {mod.label.toLowerCase()} para você o mais rápido possível.
      </p>

      <Link
        href="/admin"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-bg-surface px-4 py-2.5 text-sm text-text-ghost transition-colors hover:bg-border-default hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Voltar ao início
      </Link>
    </div>
  );
}
