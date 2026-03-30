"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { Megaphone } from "lucide-react";
import { listCampaigns } from "@/app/actions/creators/campaigns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignsTabProps {
  creatorId: string;
}

// ---------------------------------------------------------------------------
// Status map for campaigns
// ---------------------------------------------------------------------------

const CAMPAIGN_STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  draft: { label: "Rascunho", variant: "default" },
  active: { label: "Ativa", variant: "success" },
  completed: { label: "Concluida", variant: "info" },
  cancelled: { label: "Cancelada", variant: "danger" },
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  seeding: "Seeding",
  paid: "Paga",
  gifting: "Gifting",
  reward: "Recompensa",
};

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const COLUMNS: DataTableColumn<Record<string, unknown>>[] = [
  {
    key: "name",
    label: "Campanha",
    render: (value) => (
      <span className="text-sm font-medium text-text-bright">{value as string}</span>
    ),
  },
  {
    key: "campaignType",
    label: "Tipo",
    render: (value) => (
      <span className="text-sm text-text-secondary">
        {CAMPAIGN_TYPE_LABELS[value as string] ?? (value as string)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <StatusBadge status={value as string} statusMap={CAMPAIGN_STATUS_MAP} />,
  },
  {
    key: "startDate",
    label: "Inicio",
    render: (value) => (
      <span className="text-xs text-text-secondary">
        {value ? new Date(value as string).toLocaleDateString("pt-BR") : "-"}
      </span>
    ),
  },
  {
    key: "endDate",
    label: "Fim",
    render: (value) => (
      <span className="text-xs text-text-secondary">
        {value ? new Date(value as string).toLocaleDateString("pt-BR") : "-"}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CampaignsTab({ creatorId }: CampaignsTabProps) {
  const [data, setData] = React.useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchCampaigns = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // listCampaigns fetches all campaigns for the tenant
      // In a full implementation, we'd filter by creator participation
      const result = await listCampaigns({ page, per_page: 15, sort_order: "desc" });
      if (result.data) {
        setData(result.data.items as unknown as Record<string, unknown>[]);
        setTotal(result.data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <DataTable
      columns={COLUMNS}
      data={data}
      isLoading={isLoading}
      pagination={{
        page,
        pageSize: 15,
        total,
        onPageChange: setPage,
      }}
      emptyState={
        <EmptyState
          icon={Megaphone}
          title="Nenhuma campanha encontrada"
          description="As campanhas em que o creator participou aparecerão aqui."
        />
      }
    />
  );
}

export { CampaignsTab };
