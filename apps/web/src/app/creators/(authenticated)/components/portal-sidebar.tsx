"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  TrendingUp,
  Trophy,
  User,
  Star,
  Camera,
  Award,
  FileText,
  FolderOpen,
  Package,
} from "lucide-react";
import { cn } from "@ambaril/ui/lib/utils";

interface PortalSidebarVisibility {
  hasCoupon: boolean;
  hasSales: boolean;
  hasActiveChallenges: boolean;
  hasActiveBriefings: boolean;
  hasRanking: boolean;
  hasContent: boolean;
  hasPoints: boolean;
}

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Hide this item from ambassadors (who don't earn commissions) */
  hideForAmbassador?: boolean;
  /** Key in PortalSidebarVisibility that must be true to show this item */
  visibilityKey?: keyof PortalSidebarVisibility;
  /** Always show this item regardless of visibility */
  alwaysVisible?: boolean;
}

const ALL_ITEMS: SidebarItem[] = [
  { id: "dashboard", label: "Painel", href: "/creators/dashboard", icon: LayoutDashboard, alwaysVisible: true },
  { id: "coupons", label: "Meu Cupom", href: "/creators/coupons", icon: Ticket, alwaysVisible: true },
  { id: "sales", label: "Vendas", href: "/creators/sales", icon: TrendingUp, hideForAmbassador: true, visibilityKey: "hasSales" },
  { id: "earnings", label: "Ganhos", href: "/creators/earnings", icon: Award, hideForAmbassador: true, visibilityKey: "hasSales" },
  { id: "challenges", label: "Desafios", href: "/creators/challenges", icon: Trophy, visibilityKey: "hasActiveChallenges" },
  { id: "ranking", label: "Ranking", href: "/creators/ranking", icon: Star, visibilityKey: "hasRanking" },
  { id: "points", label: "Pontos", href: "/creators/points", icon: Star, visibilityKey: "hasPoints" },
  { id: "content", label: "Conteudo", href: "/creators/content", icon: Camera, visibilityKey: "hasContent" },
  { id: "briefings", label: "Briefings", href: "/creators/briefings", icon: FileText, visibilityKey: "hasActiveBriefings" },
  { id: "materials", label: "Materiais", href: "/creators/materials", icon: FolderOpen },
  { id: "products", label: "Produtos", href: "/creators/products", icon: Package },
  { id: "profile", label: "Perfil", href: "/creators/profile", icon: User, alwaysVisible: true },
];

interface PortalSidebarProps {
  isAmbassador: boolean;
  visibility?: PortalSidebarVisibility;
}

export function PortalSidebar({ isAmbassador, visibility }: PortalSidebarProps) {
  const pathname = usePathname();

  const items = ALL_ITEMS.filter((item) => {
    // Ambassador filter
    if (isAmbassador && item.hideForAmbassador) return false;
    // If no visibility prop passed, show all (backwards compatible)
    if (!visibility) return true;
    // Always visible items
    if (item.alwaysVisible) return true;
    // Check visibility key
    if (item.visibilityKey) return visibility[item.visibilityKey];
    // Default: show
    return true;
  });

  return (
    <aside className="hidden w-52 flex-col border-r border-sidebar-border bg-sidebar-bg lg:flex">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link
          href="/creators/dashboard"
          className="text-lg font-normal tracking-wide text-text-white"
        >
          Ambaril
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-l-2 border-text-tertiary bg-sidebar-item-active-bg text-text-white"
                  : "text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary",
              )}
            >
              <Icon size={18} className={cn(isActive ? "opacity-100" : "opacity-60")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
