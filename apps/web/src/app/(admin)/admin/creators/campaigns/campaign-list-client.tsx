"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Plus } from "lucide-react";
import { DataTable } from "@ambaril/ui/components/data-table";
import type { DataTableColumn } from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import type { StatusBadgeProps } from "@ambaril/ui/components/status-badge";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { CampaignFormModal } from "./components/campaign-form-modal";
import { listCampaigns } from "@/app/actions/creators/campaigns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignRow extends Record<string, unknown> {
  id: string;
  name: string;
  campaignType: string;
  status: string;
  startDate: string;
  endDate: string | null;
  totalProductCost: string;
  totalShippingCost: string;
  totalFeeCost: string;
  totalRewardCost: string;
}

interface CampaignListClientProps {
  initialCampaigns: CampaignRow[];
  initialTotal: number;
  tenantId: string;
}

// ---------------------------------------------------------------------------
// Status maps
// ---------------------------------------------------------------------------

const CAMPAIGN_STATUS_MAP: StatusBadgeProps["statusMap"] = {
  draft: { label: "Rascunho", variant: "default" },
  active: { label: "Ativa", variant: "success" },
  completed: { label: "Concluída", variant: "info" },
  cancelled: { label: "Cancelada", variant: "danger" },
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  seeding: "Seeding",
  paid: "Paga",
  gifting: "Gifting",
  reward: "Recompensa",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function computeTotalCost(row: CampaignRow): number {
  return (
    parseFloat(row.totalProductCost || "0") +
    parseFloat(row.totalShippingCost || "0") +
    parseFloat(row.totalFeeCost || "0") +
    parseFloat(row.totalRewardCost || "0")
  );
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns: DataTableColumn<CampaignRow>[] = [
  {
    key: "name",
    label: "Nome",
    sortable: true,
    render: (value) => (
      <span className="font-medium text-text-bright">{String(value)}</span>
    ),
  },
  {
    key: "campaignType",
    label: "Tipo",
    render: (value) => (
      <Badge variant="secondary">
        {CAMPAIGN_TYPE_LABELS[String(value)] ?? String(value)}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge status={String(value)} statusMap={CAMPAIGN_STATUS_MAP} />
    ),
  },
  {
    key: "startDate",
    label: "Início",
    sortable: true,
    render: (value) => (
      <span className="text-text-ghost">{formatDate(String(value))}</span>
    ),
  },
  {
    key: "endDate",
    label: "Fim",
    render: (value) => (
      <span className="text-text-ghost">
        {value ? formatDate(String(value)) : "-"}
      </span>
    ),
  },
  {
    key: "totalCost",
    label: "Custo Total",
    render: (_value, row) => (
      <span className="font-mono text-text-primary">
        R$ {formatCurrency(computeTotalCost(row))}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignListClient({
  initialCampaigns,
  initialTotal,
}: CampaignListClientProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(initialCampaigns);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePageChange = useCallback(async (newPage: number) => {
    setIsLoading(true);
    const result = await listCampaigns({ page: newPage, per_page: 25, sort_order: "desc" });
    if (result.data) {
      setCampaigns(result.data.items as unknown as CampaignRow[]);
      setTotal(result.data.total);
      setPage(newPage);
    }
    setIsLoading(false);
  }, []);

  const handleRowClick = useCallback(
    (row: CampaignRow) => {
      router.push(`/admin/creators/campaigns/${row.id}`);
    },
    [router],
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.02em] text-text-bright">Campanhas</h1>
          <p className="mt-1 text-sm text-text-ghost">
            Gerencie campanhas de creators
          </p>
        </div>
        <Button onPress={() => setIsModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {campaigns.length === 0 && !isLoading ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma campanha encontrada"
          description="Crie sua primeira campanha para começar a gerenciar creators."
          action={{
            label: "Nova Campanha",
            onPress: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div
          className="cursor-pointer"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const row = target.closest("tr[data-key]");
            if (row) {
              const key = row.getAttribute("data-key");
              const campaign = campaigns.find((c) => c.id === key);
              if (campaign) handleRowClick(campaign);
            }
          }}
        >
          <DataTable<CampaignRow>
            columns={columns}
            data={campaigns}
            isLoading={isLoading}
            pagination={{
              page,
              pageSize: 25,
              total,
              onPageChange: handlePageChange,
            }}
          />
        </div>
      )}

      <CampaignFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
