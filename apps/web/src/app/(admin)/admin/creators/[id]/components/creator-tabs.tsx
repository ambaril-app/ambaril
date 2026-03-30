"use client";

import { Tabs, type TabItem } from "@ambaril/ui/components/tabs";
import { ProfileTab } from "./profile-tab";
import { SalesTab } from "./sales-tab";
import { PointsTab } from "./points-tab";
import { PayoutsTab } from "./payouts-tab";
import { CampaignsTab } from "./campaigns-tab";
import { SocialTab } from "./social-tab";
import { AntiFraudTab } from "./anti-fraud-tab";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorTabsProps {
  creator: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    bio: string | null;
    motivation: string | null;
    contentNiches: unknown;
    contentTypes: unknown;
    clothingSize: string | null;
    birthDate: string | null;
    discoverySource: string | null;
    address: unknown;
    paymentPreference: "pix" | "store_credit" | "product" | null;
    pixKey: string | null;
    pixKeyType: "cpf" | "email" | "phone" | "random" | null;
    managedByStaff: boolean;
    contentRightsAccepted: boolean;
    suspensionReason: string | null;
    socialAccounts: Array<{
      id: string;
      platform: "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "other";
      handle: string;
      url: string | null;
      followers: number | null;
      isPrimary: boolean;
      verifiedAt: Date | null;
    }>;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CreatorTabs({ creator }: CreatorTabsProps) {
  const tabs: TabItem[] = [
    {
      key: "profile",
      label: "Perfil",
      content: <ProfileTab creator={creator} />,
    },
    {
      key: "sales",
      label: "Vendas",
      content: <SalesTab creatorId={creator.id} />,
    },
    {
      key: "points",
      label: "Pontos",
      content: <PointsTab creatorId={creator.id} />,
    },
    {
      key: "payouts",
      label: "Pagamentos",
      content: <PayoutsTab creatorId={creator.id} />,
    },
    {
      key: "campaigns",
      label: "Campanhas",
      content: <CampaignsTab creatorId={creator.id} />,
    },
    {
      key: "social",
      label: "Social",
      content: <SocialTab socialAccounts={creator.socialAccounts} />,
    },
    {
      key: "anti-fraud",
      label: "Anti-Fraude",
      content: <AntiFraudTab creatorId={creator.id} />,
    },
  ];

  return <Tabs tabs={tabs} />;
}

export { CreatorTabs };
