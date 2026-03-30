"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  TrendingUp,
  Trophy,
  User,
} from "lucide-react";
import { cn } from "@ambaril/ui/lib/utils";

interface TabItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Hide this tab from ambassadors */
  hideForAmbassador?: boolean;
}

const ALL_TABS: TabItem[] = [
  { id: "dashboard", label: "Painel", href: "/creators/dashboard", icon: LayoutDashboard },
  { id: "coupons", label: "Cupom", href: "/creators/coupons", icon: Ticket },
  { id: "sales", label: "Vendas", href: "/creators/sales", icon: TrendingUp, hideForAmbassador: true },
  { id: "challenges", label: "Desafios", href: "/creators/challenges", icon: Trophy },
  { id: "profile", label: "Perfil", href: "/creators/profile", icon: User },
];

interface PortalBottomTabsProps {
  isAmbassador: boolean;
  hasSales?: boolean;
  hasActiveChallenges?: boolean;
}

export function PortalBottomTabs({ isAmbassador, hasSales = true, hasActiveChallenges = true }: PortalBottomTabsProps) {
  const pathname = usePathname();

  const tabs = ALL_TABS.filter((tab) => {
    if (isAmbassador && tab.hideForAmbassador) return false;
    if (tab.id === "sales" && !hasSales) return false;
    if (tab.id === "challenges" && !hasActiveChallenges) return false;
    return true;
  });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border-default bg-bg-base lg:hidden">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] transition-colors",
                isActive
                  ? "text-text-white"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              <Icon size={20} className={cn(isActive && "opacity-100", !isActive && "opacity-60")} />
              <span className={cn("font-medium", isActive && "text-text-white")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
